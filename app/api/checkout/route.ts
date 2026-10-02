import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { stripeProvider } from "@/lib/billing/stripe";
import { AppError } from "@/lib/errors/app-error";
import { publicEnv } from "@/lib/env";

const bodySchema = z.object({
  plan: z.enum(["pro", "business"]),
  interval: z.enum(["month", "year"]),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Parse & validate body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ code: "VALIDATION", message: "Body JSON inválido." }, { status: 422 });
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION", message: "Campos inválidos.", issues: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const { plan, interval } = parsed.data;

    // 2. Require authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { code: "UNAUTHENTICATED", message: "Você precisa entrar para assinar um plano." },
        { status: 401 },
      );
    }

    // 3. Fetch profile to get existing Stripe customer id (if any)
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("id", user.id)
      .single();

    // Check existing subscription customer id from subscriptions table
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("provider_subscription_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    // We store stripe_customer_id in a separate lookup — try app_settings or a known column
    // For now resolve it from the active subscription's metadata if available
    const customerId: string | undefined = undefined; // resolved by Stripe via customer_email if not set

    void profile; // used only for display_name if needed later
    void subscription;

    // 4. Build URLs
    const appUrl = publicEnv.NEXT_PUBLIC_APP_URL;
    const successUrl = `${appUrl}/conta?checkout=sucesso&plan=${plan}`;
    const cancelUrl = `${appUrl}/precos?checkout=cancelado`;

    // 5. Create Stripe Checkout session
    const result = await stripeProvider.createCheckoutSession({
      userId: user.id,
      email: user.email!,
      plan,
      interval,
      customerId,
      successUrl,
      cancelUrl,
    });

    return NextResponse.json({ url: result.url }, { status: 200 });
  } catch (err) {
    console.error("[checkout] error", err);

    if (err instanceof AppError) {
      return NextResponse.json({ code: err.code, message: err.userMessage }, { status: err.httpStatus });
    }

    // Stripe-specific error messaging
    if (err instanceof Error && err.message.includes("Price ID not configured")) {
      return NextResponse.json(
        { code: "BILLING_CHECKOUT_FAILED", message: "Plano não disponível no momento. Tente em breve." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { code: "BILLING_CHECKOUT_FAILED", message: "Não conseguimos iniciar o pagamento. Tente novamente." },
      { status: 502 },
    );
  }
}
