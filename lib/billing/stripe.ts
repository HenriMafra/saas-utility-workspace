/**
 * Stripe implementation of PaymentProvider.
 * SERVER-ONLY — never import from client bundles.
 */

import Stripe from "stripe";
import { serverEnv } from "@/lib/env";
import type {
  PaymentProvider,
  CheckoutSessionOpts,
  CheckoutSessionResult,
  PortalSessionResult,
  ParsedWebhookEvent,
} from "./provider";

// Price ID map — values injected at server runtime from env vars.
const PRICE_IDS: Record<"pro" | "business", Record<"month" | "year", string>> = {
  pro: {
    month: process.env.STRIPE_PRICE_PRO_MONTH ?? "",
    year: process.env.STRIPE_PRICE_PRO_YEAR ?? "",
  },
  business: {
    month: process.env.STRIPE_PRICE_BUSINESS_MONTH ?? "",
    year: process.env.STRIPE_PRICE_BUSINESS_YEAR ?? "",
  },
};

function getStripe(): Stripe {
  return new Stripe(serverEnv("STRIPE_SECRET_KEY"), {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
}

export const stripeProvider: PaymentProvider = {
  async createCheckoutSession(opts: CheckoutSessionOpts): Promise<CheckoutSessionResult> {
    const stripe = getStripe();
    const priceId = PRICE_IDS[opts.plan][opts.interval];

    if (!priceId) {
      throw new Error(
        `Price ID not configured for plan=${opts.plan} interval=${opts.interval}. ` +
          `Set STRIPE_PRICE_${opts.plan.toUpperCase()}_${opts.interval.toUpperCase()} env var.`,
      );
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      currency: "brl",
      line_items: [{ price: priceId, quantity: 1 }],
      // Allow both credit/debit cards and Pix (BR instant payment)
      payment_method_types: ["card", "boleto"],
      payment_method_options: {
        boleto: { expires_after_days: 3 },
      },
      success_url: opts.successUrl,
      cancel_url: opts.cancelUrl,
      client_reference_id: opts.userId,
      metadata: {
        user_id: opts.userId,
        plan: opts.plan,
        interval: opts.interval,
      },
      subscription_data: {
        metadata: {
          user_id: opts.userId,
          plan: opts.plan,
        },
      },
      allow_promotion_codes: true,
      // Locale for the hosted page
      locale: "pt-BR",
    };

    // Attach existing customer or pre-fill e-mail for new one
    if (opts.customerId) {
      sessionParams.customer = opts.customerId;
    } else {
      sessionParams.customer_email = opts.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    return { sessionId: session.id, url: session.url };
  },

  async createPortalSession(customerId: string, returnUrl: string): Promise<PortalSessionResult> {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  },

  async verifyAndParseWebhook(rawBody: Buffer, sig: string): Promise<ParsedWebhookEvent> {
    const stripe = getStripe();
    const secret = serverEnv("STRIPE_WEBHOOK_SECRET");
    const event = stripe.webhooks.constructEvent(rawBody, sig, secret);
    return {
      type: event.type,
      data: event.data as unknown as Record<string, unknown>,
    };
  },
};
