import { PricingPageClient } from "./PricingPageClient";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preços — Praticca",
  description:
    "Planos simples e transparentes. Comece grátis e assine quando precisar de mais. Pro a partir de R$ 19,90/mês.",
};

export default async function PrecosPage() {
  // Detect authenticated user server-side to show current plan
  let currentPlan: string | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single();
      currentPlan = profile?.plan ?? "free";
    }
  } catch {
    // Not fatal — just show unauthenticated state
  }

  return <PricingPageClient currentPlan={currentPlan} />;
}
