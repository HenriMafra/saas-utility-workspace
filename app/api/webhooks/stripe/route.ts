/**
 * POST /api/webhooks/stripe
 *
 * Stripe webhook handler — server-only, Node.js runtime.
 *
 * Event → fulfillment mapping:
 *   checkout.session.completed  → releasePlan   (new subscription created via Checkout)
 *   invoice.paid                → releasePlan   (recurring renewal, also fires after checkout)
 *   invoice.payment_failed      → markPastDue   (payment attempt failed, grace period begins)
 *   customer.subscription.deleted → downgradeToFree (subscription cancelled/expired)
 *
 * Idempotency: every event is deduplicated via webhook_events.id (Stripe event id).
 * A second delivery of the same event returns 200 immediately.
 *
 * Error policy: on unhandled errors we log to error_logs (category 'webhook')
 * and still return 200 so Stripe does not keep retrying a bad payload.
 * Signature errors return 400 to signal an invalid delivery.
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { releasePlan, downgradeToFree, markPastDue } from "@/lib/billing/fulfillment";

export const runtime = "nodejs";

// Disable automatic body parsing so we can read the raw body for signature
// verification. Next.js App Router does not auto-parse, so req.text() is fine.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const admin = createAdminClient();

  // ------------------------------------------------------------------
  // 1. Read raw body + Stripe signature header
  // ------------------------------------------------------------------
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook secret not configured." }, { status: 500 });
  }

  // ------------------------------------------------------------------
  // 2. Validate signature
  // ------------------------------------------------------------------
  let event: Stripe.Event;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe-webhook] signature validation failed:", msg);
    // Return 400 so Stripe knows the delivery was rejected (not a server error)
    return NextResponse.json({ error: `Webhook signature invalid: ${msg}` }, { status: 400 });
  }

  // ------------------------------------------------------------------
  // 3. Deduplication — insert into webhook_events by event.id (PK)
  //    If already exists → return 200 immediately (already processed)
  // ------------------------------------------------------------------
  const { error: insertErr } = await admin.from("webhook_events").insert({
    id: event.id,
    provider: "stripe",
    type: event.type,
    processed: false,
    payload: event as unknown as Record<string, unknown>,
  });

  if (insertErr) {
    // PostgreSQL unique-violation code = '23505'
    if (insertErr.code === "23505") {
      // Duplicate event — already handled
      return NextResponse.json({ received: true, duplicate: true });
    }
    // Unexpected DB error while storing the event
    console.error("[stripe-webhook] failed to insert webhook_events:", insertErr.message);
    await logWebhookError(admin, event.id, event.type, "Failed to persist webhook event", insertErr.message);
    return NextResponse.json({ received: true });
  }

  // ------------------------------------------------------------------
  // 4. Dispatch to fulfillment handlers
  // ------------------------------------------------------------------
  try {
    await handleEvent(event);

    // Mark event as processed
    await admin
      .from("webhook_events")
      .update({ processed: true })
      .eq("id", event.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[stripe-webhook] fulfillment error for ${event.type} (${event.id}):`, msg);
    await logWebhookError(admin, event.id, event.type, "Fulfillment error", msg);
    // Return 200 — the event was received and stored; a retry would re-insert
    // a duplicate and be deduplicated on the second attempt.
    return NextResponse.json({ received: true, error: "fulfillment_error" });
  }

  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// Event handler dispatcher
// ---------------------------------------------------------------------------

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    // -----------------------------------------------------------------------
    // checkout.session.completed
    //   Fired once when the customer completes a Checkout Session.
    //   For subscription mode this is the first payment success.
    //   invoice.paid also fires for the same payment, so releasePlan must be
    //   idempotent — we use invoice.paid as the canonical crediting event and
    //   treat this one as a safety net in case invoice.paid arrives first.
    // -----------------------------------------------------------------------
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") break;

      const userId = session.metadata?.user_id ?? session.client_reference_id;
      if (!userId) {
        throw new Error("checkout.session.completed: missing user_id in metadata/client_reference_id");
      }

      const stripeSubId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      if (!stripeSubId) {
        throw new Error("checkout.session.completed: missing subscription id in session");
      }

      const planId = await resolvePlanId(session.metadata?.plan, stripeSubId);
      const periodEnd = await resolveSubscriptionPeriodEnd(stripeSubId);

      await releasePlan({ userId, planId, stripeSubscriptionId: stripeSubId, currentPeriodEnd: periodEnd });
      break;
    }

    // -----------------------------------------------------------------------
    // invoice.paid
    //   Fired on every successful payment: initial subscription creation AND
    //   every subsequent renewal. This is the canonical event for crediting.
    //   The checkout.session.completed handler above is a secondary safety net.
    // -----------------------------------------------------------------------
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeSubId =
        typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id;

      if (!stripeSubId) break; // One-off invoice, not a subscription — ignore

      const userId = invoice.metadata?.user_id ?? invoice.subscription_details?.metadata?.user_id;
      if (!userId) {
        throw new Error(`invoice.paid: could not resolve user_id for sub=${stripeSubId}`);
      }

      const planId = await resolvePlanId(invoice.metadata?.plan, stripeSubId);
      const periodEnd = await resolveSubscriptionPeriodEnd(stripeSubId);

      await releasePlan({ userId, planId, stripeSubscriptionId: stripeSubId, currentPeriodEnd: periodEnd });
      break;
    }

    // -----------------------------------------------------------------------
    // invoice.payment_failed
    //   Fired when a renewal payment attempt fails. We mark the subscription
    //   as past_due. If Stripe retries fail, it will eventually cancel the
    //   subscription, firing customer.subscription.deleted → downgradeToFree.
    // -----------------------------------------------------------------------
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeSubId =
        typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id;

      if (!stripeSubId) break;

      const userId = invoice.metadata?.user_id ?? invoice.subscription_details?.metadata?.user_id;
      if (!userId) {
        throw new Error(`invoice.payment_failed: could not resolve user_id for sub=${stripeSubId}`);
      }

      await markPastDue(userId, stripeSubId);
      break;
    }

    // -----------------------------------------------------------------------
    // customer.subscription.deleted
    //   Fired when a subscription is cancelled (by user, admin, or after
    //   all payment retries are exhausted). We revert the user to the free plan.
    // -----------------------------------------------------------------------
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.user_id;

      if (!userId) {
        throw new Error(`customer.subscription.deleted: missing user_id in subscription metadata id=${sub.id}`);
      }

      await downgradeToFree(userId, sub.id);
      break;
    }

    default:
      // Unhandled event type — not an error, just not relevant
      break;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the internal plan id from metadata or by fetching the Stripe
 * subscription's price id and matching it against our env-var price map.
 *
 * Priority:
 *   1. `plan` key in Stripe metadata (set at checkout creation)
 *   2. Price id lookup against env-var price map
 *
 * Falls back to a safe default if nothing matches.
 */
async function resolvePlanId(
  metaPlan: string | undefined | null,
  stripeSubId: string,
): Promise<string> {
  // If the plan slug is stored in metadata use it directly as the plan.id
  // (assumes plans.id follows the pattern "<slug>_month" / "<slug>_year").
  // The checkout session stores only the tier slug (e.g. "pro", "business"),
  // so we need the interval too — fetch from Stripe if necessary.
  if (metaPlan) {
    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(stripeSubId, {
      expand: ["items.data.price"],
    });
    const price = sub.items.data[0]?.price;
    const interval = price?.recurring?.interval === "year" ? "year" : "month";
    return `${metaPlan}_${interval}`;
  }

  // Fallback: match price id against known env var price ids
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(stripeSubId, {
    expand: ["items.data.price"],
  });
  const priceId = sub.items.data[0]?.price?.id ?? "";
  const interval =
    sub.items.data[0]?.price?.recurring?.interval === "year" ? "year" : "month";

  const PRICE_IDS: Record<string, string> = {
    [process.env.STRIPE_PRICE_PRO_MONTH ?? ""]: `pro_month`,
    [process.env.STRIPE_PRICE_PRO_YEAR ?? ""]: `pro_year`,
    [process.env.STRIPE_PRICE_BUSINESS_MONTH ?? ""]: `business_month`,
    [process.env.STRIPE_PRICE_BUSINESS_YEAR ?? ""]: `business_year`,
  };

  return PRICE_IDS[priceId] ?? `pro_${interval}`;
}

/** Fetch the current_period_end Unix timestamp from Stripe for a subscription. */
async function resolveSubscriptionPeriodEnd(stripeSubId: string): Promise<number> {
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(stripeSubId);
  return sub.current_period_end;
}

function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
}

/** Insert a row into error_logs with category 'webhook'. */
async function logWebhookError(
   
  admin: ReturnType<typeof createAdminClient>,
  eventId: string,
  eventType: string,
  friendlyMessage: string,
  technicalMessage: string,
): Promise<void> {
  try {
    await admin.from("error_logs").insert({
      level: "error",
      category: "webhook",
      friendly_message: friendlyMessage,
      technical_message: `[${eventType}] event=${eventId} – ${technicalMessage}`,
    });
  } catch (logErr) {
    // Do not throw from error logger — just print
    console.error("[stripe-webhook] failed to write error_log:", logErr);
  }
}
