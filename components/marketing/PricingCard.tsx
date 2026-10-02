"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";

interface PlanConfig {
  id: "free" | "pro" | "business";
  name: string;
  description: string;
  monthCents: number;
  yearMonthlyCents: number; // monthly equivalent when billed annually
  yearTotalCents: number;   // actual charge per year
  credits: number | null;   // null = unlimited
  features: string[];
  ctaLabel: string;
  ctaHref?: string; // for free plan
}

const PLANS: Record<"free" | "pro" | "business", PlanConfig> = {
  free: {
    id: "free",
    name: "Grátis",
    description: "Para uso esporádico e testes.",
    monthCents: 0,
    yearMonthlyCents: 0,
    yearTotalCents: 0,
    credits: 20,
    features: [
      "20 operações por mês",
      "Ferramentas básicas de PDF",
      "Ferramentas de imagem",
      "Processamento no navegador",
      "Arquivos até 10 MB",
    ],
    ctaLabel: "Começar grátis",
    ctaHref: "/cadastro",
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Para quem usa todo dia.",
    monthCents: 1990,
    yearMonthlyCents: 1658, // ~1990 * 10 / 12
    yearTotalCents: 19900,
    credits: 500,
    features: [
      "500 operações por mês",
      "Todas as ferramentas",
      "Processamento no servidor",
      "Arquivos até 100 MB",
      "Histórico de 30 dias",
      "Pix e cartão",
      "Suporte prioritário",
    ],
    ctaLabel: "Assinar Pro",
  },
  business: {
    id: "business",
    name: "Business",
    description: "Para equipes e uso intenso.",
    monthCents: 4990,
    yearMonthlyCents: 4158, // ~4990 * 10 / 12
    yearTotalCents: 49900,
    credits: null,
    features: [
      "Operações ilimitadas",
      "Todas as ferramentas",
      "Processamento no servidor",
      "Arquivos até 500 MB",
      "Histórico de 90 dias",
      "API de acesso",
      "Múltiplos usuários (em breve)",
      "Suporte dedicado",
    ],
    ctaLabel: "Assinar Business",
  },
};

interface PricingCardProps {
  plan: "free" | "pro" | "business";
  billing: "month" | "year";
  highlighted?: boolean;
  currentPlan?: string | null;
}

export function PricingCard({ plan, billing, highlighted = false, currentPlan }: PricingCardProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const config = PLANS[plan];
  const isCurrent = currentPlan === plan;

  const displayCents =
    plan === "free"
      ? 0
      : billing === "month"
        ? config.monthCents
        : config.yearMonthlyCents;

  const isAnnual = billing === "year" && plan !== "free";

  async function handleCta() {
    if (config.ctaHref) {
      router.push(config.ctaHref);
      return;
    }
    if (isCurrent) return;

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval: billing }),
      });

      const data = await res.json() as { url?: string; message?: string };

      if (!res.ok) {
        toast.error(data.message ?? "Erro ao iniciar pagamento.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error("Não conseguimos iniciar o pagamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-8 transition-shadow",
        highlighted
          ? "border-brand-500 bg-brand-50 shadow-xl shadow-brand-500/10 dark:bg-brand-950/20"
          : "border-border bg-surface shadow-sm hover:shadow-md",
      )}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge variant="brand" className="px-4 py-1 text-xs font-semibold uppercase tracking-wide">
            Mais popular
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h3 className="font-display text-xl font-bold">{config.name}</h3>
        <p className="mt-1 text-sm text-muted">{config.description}</p>
      </div>

      {/* Price */}
      <div className="mb-6" aria-label={`Preço do plano ${config.name}`}>
        {plan === "free" ? (
          <p className="font-display text-4xl font-bold">Grátis</p>
        ) : (
          <>
            <div className="flex items-end gap-1">
              <span className="font-display text-4xl font-bold">{formatBRL(displayCents)}</span>
              <span className="mb-1 text-muted">/mês</span>
            </div>
            {isAnnual && (
              <p className="mt-1 text-sm text-muted">
                Cobrado {formatBRL(config.yearTotalCents)} por ano
              </p>
            )}
          </>
        )}
      </div>

      {/* CTA */}
      <Button
        variant={highlighted ? "primary" : "secondary"}
        size="lg"
        className="mb-8 w-full"
        loading={loading}
        disabled={isCurrent}
        onClick={handleCta}
        aria-label={
          isCurrent
            ? `Plano atual: ${config.name}`
            : `${config.ctaLabel} — plano ${config.name}`
        }
      >
        {isCurrent ? "Plano atual" : config.ctaLabel}
      </Button>

      {/* Credits callout */}
      {config.credits !== null ? (
        <p className="mb-4 rounded-lg bg-neutral-100 px-3 py-2 text-center text-sm font-medium dark:bg-neutral-800">
          {config.credits} operações / mês
        </p>
      ) : (
        <p className="mb-4 rounded-lg bg-brand-100 px-3 py-2 text-center text-sm font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
          Operações ilimitadas
        </p>
      )}

      {/* Feature list */}
      <ul className="space-y-2.5" aria-label={`Recursos do plano ${config.name}`}>
        {config.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0 text-success-600"
              aria-hidden
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
