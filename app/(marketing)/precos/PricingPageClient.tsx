"use client";

import { useState } from "react";
import { Check, X, HelpCircle } from "lucide-react";
import { BillingToggle } from "@/components/marketing/BillingToggle";
import { PricingCard } from "@/components/marketing/PricingCard";
import { cn } from "@/lib/utils";

interface Props {
  currentPlan: string | null;
}

// ── Comparison table ─────────────────────────────────────────────────────────

type CellValue = boolean | string;

interface TableRow {
  feature: string;
  tooltip?: string;
  free: CellValue;
  pro: CellValue;
  business: CellValue;
}

const TABLE_ROWS: TableRow[] = [
  { feature: "Operações por mês",        free: "20",        pro: "500",        business: "Ilimitadas" },
  { feature: "Ferramentas de PDF",       free: "Básicas",   pro: "Todas",      business: "Todas"      },
  { feature: "Ferramentas de imagem",    free: true,        pro: true,         business: true         },
  { feature: "Conversor de documentos",  free: false,       pro: true,         business: true         },
  { feature: "Tamanho máximo de arquivo",free: "10 MB",     pro: "100 MB",     business: "500 MB"     },
  { feature: "Processamento no servidor",free: false,       pro: true,         business: true         },
  { feature: "Histórico de arquivos",    free: false,       pro: "30 dias",    business: "90 dias"    },
  { feature: "API de acesso",            free: false,       pro: false,        business: true         },
  { feature: "Suporte",                  free: "Comunidade",pro: "Prioritário",business: "Dedicado"   },
  { feature: "Pix e cartão",             free: false,       pro: true,         business: true         },
  { feature: "Cancelamento a qualquer momento", free: true, pro: true,         business: true         },
];

function CellIcon({ value }: { value: CellValue }) {
  if (typeof value === "string") {
    return <span className="text-sm font-medium">{value}</span>;
  }
  if (value) {
    return <Check className="mx-auto h-5 w-5 text-success-600" aria-label="Incluído" />;
  }
  return <X className="mx-auto h-5 w-5 text-danger-400" aria-label="Não incluído" />;
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Cancele a qualquer momento diretamente no painel de conta. Você continua com acesso até o final do período já pago — sem cobranças extras.",
  },
  {
    q: "Quais formas de pagamento são aceitas?",
    a: "Aceitamos cartão de crédito/débito e Pix. O pagamento é processado com segurança pelo Stripe.",
  },
  {
    q: "O que são 'operações'?",
    a: "Cada uso de uma ferramenta conta como uma operação — por exemplo, comprimir um PDF, converter uma imagem ou extrair texto. Operações que falham não são contadas.",
  },
  {
    q: "Meu plano renova automaticamente?",
    a: "Sim, planos mensais e anuais renovam automaticamente. Você recebe um aviso por e-mail antes de cada renovação e pode cancelar a qualquer momento.",
  },
  {
    q: "Tenho desconto no plano anual?",
    a: "Sim — o plano anual equivale a 2 meses grátis (cerca de 17% de desconto comparado ao mensal).",
  },
  {
    q: "Preciso de nota fiscal?",
    a: "O Stripe emite um recibo por e-mail a cada cobrança. Para nota fiscal completa entre em contato conosco em suporte@praticca.com.br.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border py-4">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="font-medium">{q}</span>
        <HelpCircle
          className={cn("h-4 w-4 shrink-0 text-muted transition-transform", open && "rotate-180 text-brand-500")}
          aria-hidden
        />
      </button>
      {open && <p className="mt-2 text-sm text-muted">{a}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function PricingPageClient({ currentPlan }: Props) {
  const [billing, setBilling] = useState<"month" | "year">("month");

  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-content px-4 pb-10 pt-16 text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
          Planos simples e transparentes
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
          Comece grátis, sem cartão. Assine quando precisar de mais poder.
        </p>

        <div className="mt-8 flex justify-center">
          <BillingToggle value={billing} onChange={setBilling} />
        </div>
      </section>

      {/* Cards */}
      <section
        aria-label="Planos disponíveis"
        className="mx-auto grid max-w-content gap-6 px-4 pb-16 sm:grid-cols-2 lg:grid-cols-3"
      >
        <PricingCard plan="free"     billing={billing} currentPlan={currentPlan} />
        <PricingCard plan="pro"      billing={billing} highlighted currentPlan={currentPlan} />
        <PricingCard plan="business" billing={billing} currentPlan={currentPlan} />
      </section>

      {/* Credits block */}
      <section className="mx-auto max-w-content px-4 py-10">
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-8 dark:border-brand-800 dark:bg-brand-950/20">
          <h2 className="font-display text-xl font-semibold">Como funcionam os créditos?</h2>
          <p className="mt-2 text-muted">
            Cada ferramenta consome 1 operação por uso. Ferramentas que processam vários arquivos de
            uma vez consomem 1 operação por arquivo. Operações com falha não são cobradas. Créditos
            não utilizados não acumulam para o próximo mês.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { plan: "Grátis", credits: "20 operações", reset: "Mensal" },
              { plan: "Pro",    credits: "500 operações", reset: "Mensal" },
              { plan: "Business", credits: "Ilimitadas", reset: "—" },
            ].map(({ plan, credits, reset }) => (
              <div key={plan} className="rounded-xl border border-border bg-bg p-4">
                <p className="text-sm font-medium text-muted">{plan}</p>
                <p className="mt-1 font-display text-2xl font-bold">{credits}</p>
                {reset !== "—" && <p className="mt-1 text-xs text-muted">Renova: {reset}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="mx-auto max-w-content overflow-x-auto px-4 py-10">
        <h2 className="mb-6 font-display text-2xl font-semibold">Comparativo de recursos</h2>
        <table className="w-full border-collapse text-sm" aria-label="Comparativo de planos">
          <thead>
            <tr>
              <th scope="col" className="w-1/2 pb-4 text-left font-medium text-muted">
                Recurso
              </th>
              {(["Grátis", "Pro", "Business"] as const).map((name) => (
                <th
                  key={name}
                  scope="col"
                  className={cn(
                    "pb-4 text-center font-semibold",
                    name === "Pro" && "text-brand-600",
                  )}
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TABLE_ROWS.map((row, i) => (
              <tr
                key={row.feature}
                className={cn(
                  "border-t border-border",
                  i % 2 === 0 ? "" : "bg-surface/50",
                )}
              >
                <td className="py-3 pr-4 font-medium">
                  {row.feature}
                  {row.tooltip && (
                    <span
                      className="ml-1 cursor-help text-muted"
                      title={row.tooltip}
                      aria-label={row.tooltip}
                    >
                      *
                    </span>
                  )}
                </td>
                <td className="py-3 text-center">
                  <CellIcon value={row.free} />
                </td>
                <td className="py-3 text-center">
                  <CellIcon value={row.pro} />
                </td>
                <td className="py-3 text-center">
                  <CellIcon value={row.business} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-2xl px-4 py-10">
        <h2 className="mb-6 font-display text-2xl font-semibold">Perguntas frequentes</h2>
        {FAQ_ITEMS.map((item) => (
          <FaqItem key={item.q} q={item.q} a={item.a} />
        ))}
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-content px-4 py-16 text-center">
        <div className="rounded-2xl border border-border bg-surface px-6 py-12">
          <h2 className="font-display text-2xl font-semibold">Ainda com dúvidas?</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">
            Fale com a gente pelo chat ou por e-mail e respondemos em até 1 dia útil.
          </p>
          <a
            href="mailto:suporte@praticca.com.br"
            className="mt-6 inline-block rounded-md bg-brand-500 px-6 py-3 text-sm font-medium text-white hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Falar com o suporte
          </a>
        </div>
      </section>
    </main>
  );
}
