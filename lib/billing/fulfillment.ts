/**
 * Billing fulfillment helpers — server-only.
 * Called by the Stripe webhook handler after each billing event is validated
 * and deduplicated. All operations are idempotent (upsert / on-conflict).
 *
 * Function map:
 *   releasePlan      → checkout.session.completed / invoice.paid (first payment)
 *   markPastDue      → invoice.payment_failed
 *   downgradeToFree  → customer.subscription.deleted
 */

import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReleasePlanOpts {
  userId: string;
  /** Internal plan id matching plans.id (e.g. "pro_month", "business_year"). */
  planId: string;
  /** Stripe subscription id stored in subscriptions.provider_subscription_id. */
  stripeSubscriptionId: string;
  /** End of current billing period (Unix timestamp from Stripe). */
  currentPeriodEnd: number;
}

// ---------------------------------------------------------------------------
// releasePlan
// ---------------------------------------------------------------------------

/**
 * Activate or renew a paid subscription:
 *  1. Upsert subscriptions row (active, updated period end).
 *  2. Update profiles.plan to match the plan's tier.
 *  3. Credit monthly_credits from plans table into credits + credit_transactions.
 *
 * Idempotent: calling twice with the same subscription id just re-upserts
 * with the same values. Credits are only added when status transitions
 * from non-active → active (or on first creation) to avoid double-crediting
 * on repeated invoice.paid events for the same period.
 */
export async function releasePlan(opts: ReleasePlanOpts): Promise<void> {
  const { userId, planId, stripeSubscriptionId, currentPeriodEnd } = opts;
  const admin = createAdminClient();
  const periodEndTs = new Date(currentPeriodEnd * 1000).toISOString();

  // 1. Fetch the plan's tier and monthly_credits
  const { data: plan, error: planErr } = await admin
    .from("plans")
    .select("tier, monthly_credits")
    .eq("id", planId)
    .maybeSingle();

  if (planErr || !plan) {
    throw new Error(
      `fulfillment.releasePlan: plan not found id=${planId} – ${planErr?.message ?? "no row"}`,
    );
  }

  // 2. Check the current subscription state to determine if we should credit.
  //    We only credit once per period by checking if the subscription row
  //    already exists and is active with the same period_end.
  const { data: existingSub } = await admin
    .from("subscriptions")
    .select("id, status, current_period_end")
    .eq("provider_subscription_id", stripeSubscriptionId)
    .maybeSingle();

  const alreadyActiveSamePeriod =
    existingSub?.status === "active" &&
    existingSub?.current_period_end === periodEndTs;

  // 3. Upsert subscriptions row
  const { error: subErr } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      plan_id: planId,
      status: "active",
      provider: "stripe",
      provider_subscription_id: stripeSubscriptionId,
      current_period_end: periodEndTs,
      cancel_at_period_end: false,
    },
    { onConflict: "provider_subscription_id" },
  );

  if (subErr) {
    throw new Error(`fulfillment.releasePlan: upsert subscriptions – ${subErr.message}`);
  }

  // 4. Update profiles.plan to the tier of the purchased plan
  const { error: profileErr } = await admin
    .from("profiles")
    .update({ plan: plan.tier })
    .eq("id", userId);

  if (profileErr) {
    throw new Error(`fulfillment.releasePlan: update profiles.plan – ${profileErr.message}`);
  }

  // 5. Credit monthly_credits only on new period (not on duplicate events)
  if (!alreadyActiveSamePeriod && plan.monthly_credits > 0) {
    // Fetch current balance
    const { data: creditRow } = await admin
      .from("credits")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    const currentBalance = creditRow?.balance ?? 0;
    const newBalance = currentBalance + plan.monthly_credits;

    // Upsert credits
    const { error: credErr } = await admin
      .from("credits")
      .upsert({ user_id: userId, balance: newBalance }, { onConflict: "user_id" });

    if (credErr) {
      throw new Error(`fulfillment.releasePlan: upsert credits – ${credErr.message}`);
    }

    // Record credit transaction
    await admin.from("credit_transactions").insert({
      user_id: userId,
      delta: plan.monthly_credits,
      reason: `subscription:monthly_grant:${planId}`,
      balance_after: newBalance,
    });
  }
}

// ---------------------------------------------------------------------------
// downgradeToFree
// ---------------------------------------------------------------------------

/**
 * Mark a subscription as cancelled and revert the user's plan to 'free'.
 * Triggered by customer.subscription.deleted.
 * Credits already consumed are NOT rolled back.
 */
export async function downgradeToFree(
  userId: string,
  stripeSubscriptionId?: string,
): Promise<void> {
  const admin = createAdminClient();

  // Update subscription status to cancelled
  if (stripeSubscriptionId) {
    await admin
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("provider_subscription_id", stripeSubscriptionId);
  } else {
    // Fallback: cancel all active subscriptions for this user
    await admin
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("user_id", userId)
      .eq("status", "active");
  }

  // Revert profile plan to free
  const { error: profileErr } = await admin
    .from("profiles")
    .update({ plan: "free" })
    .eq("id", userId);

  if (profileErr) {
    throw new Error(`fulfillment.downgradeToFree: update profiles.plan – ${profileErr.message}`);
  }
}

// ---------------------------------------------------------------------------
// markPastDue
// ---------------------------------------------------------------------------

/**
 * Mark the user's subscription as past_due when a payment fails.
 * Triggered by invoice.payment_failed.
 * Does NOT revoke access immediately — that is handled by a separate
 * grace-period policy (e.g. after N failed attempts Stripe cancels the sub
 * and fires customer.subscription.deleted → downgradeToFree).
 */
export async function markPastDue(
  userId: string,
  stripeSubscriptionId?: string,
): Promise<void> {
  const admin = createAdminClient();

  if (stripeSubscriptionId) {
    await admin
      .from("subscriptions")
      .update({ status: "past_due" })
      .eq("provider_subscription_id", stripeSubscriptionId)
      .eq("user_id", userId);
  } else {
    await admin
      .from("subscriptions")
      .update({ status: "past_due" })
      .eq("user_id", userId)
      .eq("status", "active");
  }
  // profiles.plan is intentionally left unchanged during past_due grace period.
}
