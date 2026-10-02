import { z } from "zod";

/** Schema de checkout de assinatura ou compra de créditos avulsos. */
export const CheckoutSchema = z.object({
  planId: z.string().optional(),
  billingPeriod: z.enum(["month", "year"]).default("month"),
  couponCode: z.string().optional(),
  credits: z.number().int().positive().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export type CheckoutInput = z.infer<typeof CheckoutSchema>;

/** Schema de aplicação de cupom. */
export const ApplyCouponSchema = z.object({
  code: z.string().min(1).max(50),
});

export type ApplyCouponInput = z.infer<typeof ApplyCouponSchema>;

/** Schema de cancelamento de assinatura. */
export const CancelSubscriptionSchema = z.object({
  atPeriodEnd: z.boolean().default(true),
});

export type CancelSubscriptionInput = z.infer<typeof CancelSubscriptionSchema>;
