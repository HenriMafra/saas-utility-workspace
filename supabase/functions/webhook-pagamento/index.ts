/**
 * webhook-pagamento
 *
 * Gatilho: POST do Stripe para /functions/v1/webhook-pagamento
 *          Configure o endpoint no Dashboard Stripe apontando para esta URL.
 * Entrada: body raw do Stripe + header "stripe-signature"
 * Saída:   JSON { received: true } em sucesso | erro HTTP em falha
 *
 * Idempotência: verifica webhook_events (id = stripe event id) antes de processar.
 *
 * Eventos tratados:
 *   - checkout.session.completed      → cria/ativa subscription + credita créditos
 *   - customer.subscription.updated   → atualiza status/período da subscription
 *   - customer.subscription.deleted   → cancela subscription, reverte plano para free
 *   - invoice.payment_succeeded       → renova créditos mensais
 *   - invoice.payment_failed          → marca subscription como past_due
 *
 * Variáveis de ambiente necessárias:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_WEBHOOK_SECRET
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

  if (!supabaseUrl || !serviceRoleKey || !webhookSecret || !stripeKey) {
    return new Response(
      JSON.stringify({ error: "Variáveis de ambiente ausentes." }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" });
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Verifica assinatura Stripe
  const signature = req.headers.get("stripe-signature") ?? "";
  const rawBody = await req.arrayBuffer();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      new Uint8Array(rawBody),
      signature,
      webhookSecret
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: `Assinatura inválida: ${msg}` }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // ── Idempotência ─────────────────────────────────────────────────────────
  const { data: existing } = await supabase
    .from("webhook_events")
    .select("id, processed")
    .eq("id", event.id)
    .maybeSingle();

  if (existing?.processed) {
    return new Response(JSON.stringify({ received: true, skipped: "already_processed" }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // Registra evento (upsert para evitar race condition)
  await supabase.from("webhook_events").upsert({
    id: event.id,
    provider: "stripe",
    type: event.type,
    processed: false,
    payload: event,
  });

  // ── Processamento por tipo ────────────────────────────────────────────────
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const planId = session.metadata?.plan_id;

        if (!userId || !planId) break;

        // Busca créditos do plano
        const { data: plan } = await supabase
          .from("plans")
          .select("monthly_credits")
          .eq("id", planId)
          .single();

        const monthlyCredits = plan?.monthly_credits ?? 0;

        // Upsert subscription
        await supabase.from("subscriptions").upsert({
          user_id: userId,
          plan_id: planId,
          status: "active",
          provider_subscription_id: session.subscription as string,
          current_period_end: new Date(
            ((session.subscription as Stripe.Subscription)?.current_period_end ?? 0) * 1000
          ).toISOString(),
          cancel_at_period_end: false,
        });

        // Atualiza plano no profile
        await supabase.from("profiles").update({ plan: planId }).eq("id", userId);

        // Concede créditos iniciais
        if (monthlyCredits > 0) {
          const { data: credit } = await supabase
            .from("credits")
            .select("balance")
            .eq("user_id", userId)
            .single();

          const newBalance = (credit?.balance ?? 0) + monthlyCredits;
          await supabase.from("credits").upsert({ user_id: userId, balance: newBalance });
          await supabase.from("credit_transactions").insert({
            user_id: userId,
            delta: monthlyCredits,
            reason: `checkout.session.completed:${event.id}`,
            balance_after: newBalance,
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) break;

        await supabase
          .from("subscriptions")
          .update({
            status: sub.status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
          })
          .eq("provider_subscription_id", sub.id);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        await supabase
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("provider_subscription_id", sub.id);

        // Reverte profile para plano free
        const userId = sub.metadata?.supabase_user_id;
        if (userId) {
          await supabase.from("profiles").update({ plan: "free" }).eq("id", userId);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription as string;

        // Atualiza período da subscription
        if (subId) {
          await supabase
            .from("subscriptions")
            .update({ status: "active" })
            .eq("provider_subscription_id", subId);
        }

        // Renova créditos mensais se for renovação (não a primeira invoice do checkout)
        const userId = invoice.metadata?.supabase_user_id ?? (invoice as unknown as Record<string, unknown>).customer_metadata?.supabase_user_id;
        const planId = invoice.metadata?.plan_id;

        if (userId && planId && invoice.billing_reason === "subscription_cycle") {
          const { data: plan } = await supabase
            .from("plans")
            .select("monthly_credits")
            .eq("id", planId)
            .single();

          const monthlyCredits = plan?.monthly_credits ?? 0;
          if (monthlyCredits > 0) {
            const { data: credit } = await supabase
              .from("credits")
              .select("balance")
              .eq("user_id", userId)
              .single();

            const newBalance = (credit?.balance ?? 0) + monthlyCredits;
            await supabase.from("credits").upsert({ user_id: userId, balance: newBalance });
            await supabase.from("credit_transactions").insert({
              user_id: userId,
              delta: monthlyCredits,
              reason: `invoice.payment_succeeded:${event.id}`,
              balance_after: newBalance,
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription as string;
        if (subId) {
          await supabase
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("provider_subscription_id", subId);
        }
        break;
      }

      default:
        // Evento não tratado — registra e ignora
        break;
    }

    // Marca evento como processado
    await supabase
      .from("webhook_events")
      .update({ processed: true })
      .eq("id", event.id);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Não marca como processado para permitir retry do Stripe
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
