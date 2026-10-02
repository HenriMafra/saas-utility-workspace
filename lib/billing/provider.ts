/**
 * PaymentProvider interface — implemented by Stripe (and potentially other
 * providers in the future). All methods are server-only.
 */

export interface CheckoutSessionOpts {
  userId: string;
  email: string;
  plan: "pro" | "business";
  interval: "month" | "year";
  /** Optional existing Stripe customer id to re-use. */
  customerId?: string;
  /** Absolute URL to redirect after success. */
  successUrl: string;
  /** Absolute URL to redirect after cancel. */
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

export interface PortalSessionResult {
  url: string;
}

export interface ParsedWebhookEvent {
  type: string;
  /** Raw provider event object — narrow with discriminated union in handlers. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

export interface PaymentProvider {
  /**
   * Create a hosted Checkout session and return the redirect URL.
   */
  createCheckoutSession(opts: CheckoutSessionOpts): Promise<CheckoutSessionResult>;

  /**
   * Create a Customer Portal session so the user can manage their subscription.
   */
  createPortalSession(customerId: string, returnUrl: string): Promise<PortalSessionResult>;

  /**
   * Verify the webhook signature and return the parsed event.
   * Throws if the signature is invalid.
   */
  verifyAndParseWebhook(rawBody: Buffer, sig: string): Promise<ParsedWebhookEvent>;
}
