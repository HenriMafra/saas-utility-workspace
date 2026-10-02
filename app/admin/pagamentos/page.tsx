import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateBR, formatBRL } from "@/lib/utils";
import { ResendWebhookButton } from "./ResendWebhookButton";

export const metadata = { title: "Pagamentos — Admin" };
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PaymentStatus = "succeeded" | "pending" | "failed" | "refunded" | string;
type SubStatus = "active" | "trialing" | "past_due" | "canceled" | "incomplete" | string;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PAYMENT_BADGE: Record<PaymentStatus, "success" | "warning" | "danger" | "neutral"> = {
  succeeded: "success",
  pending: "warning",
  failed: "danger",
  refunded: "neutral",
};

const SUB_BADGE: Record<SubStatus, "success" | "warning" | "danger" | "neutral"> = {
  active: "success",
  trialing: "neutral",
  past_due: "warning",
  canceled: "danger",
  incomplete: "neutral",
};

function paymentBadge(status: string): "success" | "warning" | "danger" | "neutral" {
  return PAYMENT_BADGE[status] ?? "neutral";
}

function subBadge(status: string): "success" | "warning" | "danger" | "neutral" {
  return SUB_BADGE[status] ?? "neutral";
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function fetchPayments(statusFilter: string) {
  const admin = createAdminClient();

  let q = admin
    .from("payments")
    .select("id, user_id, amount_cents, currency, status, provider, provider_payment_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (statusFilter && statusFilter !== "all") {
    q = q.eq("status", statusFilter);
  }

  const { data } = await q;
  return data ?? [];
}

async function fetchSubscriptions(statusFilter: string) {
  const admin = createAdminClient();

  let q = admin
    .from("subscriptions")
    .select("id, user_id, plan_id, status, provider_subscription_id, current_period_end, cancel_at_period_end, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (statusFilter && statusFilter !== "all") {
    q = q.eq("status", statusFilter);
  }

  const { data } = await q;
  return data ?? [];
}

async function fetchPendingWebhooks() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("webhook_events")
    .select("id, provider, type, created_at, processed")
    .eq("processed", false)
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const PAYMENT_STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "succeeded", label: "Sucesso" },
  { value: "pending", label: "Pendente" },
  { value: "failed", label: "Falha" },
  { value: "refunded", label: "Reembolso" },
];

const SUB_STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Ativo" },
  { value: "trialing", label: "Trial" },
  { value: "past_due", label: "Atrasado" },
  { value: "canceled", label: "Cancelado" },
];

export default async function AdminPagamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ ps?: string; ss?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/pagamentos");

  const { ps = "all", ss = "all" } = await searchParams;

  const [payments, subscriptions, pendingWebhooks] = await Promise.all([
    fetchPayments(ps),
    fetchSubscriptions(ss),
    fetchPendingWebhooks(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-fg">Pagamentos</h1>
        <p className="mt-1 text-sm text-muted">
          Histórico de cobranças, assinaturas ativas e eventos de webhook.
        </p>
      </div>

      {/* Payments section */}
      <section aria-labelledby="payments-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2
            id="payments-heading"
            className="text-xs font-semibold uppercase tracking-wider text-muted"
          >
            Cobranças ({payments.length})
          </h2>

          {/* Filter */}
          <form method="GET" action="/admin/pagamentos" aria-label="Filtrar por status de cobrança">
            <input type="hidden" name="ss" value={ss} />
            <div className="flex items-center gap-2">
              <label htmlFor="ps-filter" className="text-xs text-muted">
                Status:
              </label>
              <select
                id="ps-filter"
                name="ps"
                defaultValue={ps}
                onChange={(e) => {
                  // Progressive enhancement: submit form on change via JS if available
                  (e.target.closest("form") as HTMLFormElement)?.submit();
                }}
                className="rounded-md border border-border bg-bg px-2 py-1 text-xs text-fg focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label="Filtrar por status de cobrança"
              >
                {PAYMENT_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-md bg-brand-500 px-3 py-1 text-xs font-medium text-white hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                Filtrar
              </button>
            </div>
          </form>
        </div>

        <Suspense fallback={<TableSkeleton />}>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table
                className="w-full text-sm"
                role="table"
                aria-label="Lista de cobranças"
              >
                <thead>
                  <tr className="border-b border-border bg-surface text-left">
                    <th scope="col" className="px-4 py-3 font-medium text-muted">ID</th>
                    <th scope="col" className="px-4 py-3 font-medium text-muted">Usuário</th>
                    <th scope="col" className="px-4 py-3 font-medium text-muted">Valor</th>
                    <th scope="col" className="px-4 py-3 font-medium text-muted">Status</th>
                    <th scope="col" className="px-4 py-3 font-medium text-muted">Provedor</th>
                    <th scope="col" className="px-4 py-3 font-medium text-muted">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-sm text-muted"
                      >
                        Nenhuma cobrança encontrada.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p, i) => (
                      <tr
                        key={p.id}
                        className={`border-b border-border last:border-0 transition-colors hover:bg-surface/60 ${
                          i % 2 === 0 ? "bg-bg" : "bg-surface/30"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-muted">
                            {p.id.slice(0, 8)}…
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted">
                          {p.user_id?.slice(0, 8)}…
                        </td>
                        <td className="px-4 py-3 font-medium text-fg">
                          {formatBRL(p.amount_cents ?? 0)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={paymentBadge(p.status)}>{p.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted">{p.provider}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                          <time dateTime={p.created_at}>{formatDateBR(p.created_at)}</time>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </Suspense>
      </section>

      {/* Subscriptions section */}
      <section aria-labelledby="subs-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2
            id="subs-heading"
            className="text-xs font-semibold uppercase tracking-wider text-muted"
          >
            Assinaturas ({subscriptions.length})
          </h2>

          <form method="GET" action="/admin/pagamentos" aria-label="Filtrar por status de assinatura">
            <input type="hidden" name="ps" value={ps} />
            <div className="flex items-center gap-2">
              <label htmlFor="ss-filter" className="text-xs text-muted">
                Status:
              </label>
              <select
                id="ss-filter"
                name="ss"
                defaultValue={ss}
                className="rounded-md border border-border bg-bg px-2 py-1 text-xs text-fg focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label="Filtrar por status de assinatura"
              >
                {SUB_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-md bg-brand-500 px-3 py-1 text-xs font-medium text-white hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                Filtrar
              </button>
            </div>
          </form>
        </div>

        <Suspense fallback={<TableSkeleton />}>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table
                className="w-full text-sm"
                role="table"
                aria-label="Lista de assinaturas"
              >
                <thead>
                  <tr className="border-b border-border bg-surface text-left">
                    <th scope="col" className="px-4 py-3 font-medium text-muted">ID</th>
                    <th scope="col" className="px-4 py-3 font-medium text-muted">Usuário</th>
                    <th scope="col" className="px-4 py-3 font-medium text-muted">Plano</th>
                    <th scope="col" className="px-4 py-3 font-medium text-muted">Status</th>
                    <th scope="col" className="px-4 py-3 font-medium text-muted">Próx. cobrança</th>
                    <th scope="col" className="px-4 py-3 font-medium text-muted">Cancelamento</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-sm text-muted"
                      >
                        Nenhuma assinatura encontrada.
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((s, i) => (
                      <tr
                        key={s.id}
                        className={`border-b border-border last:border-0 transition-colors hover:bg-surface/60 ${
                          i % 2 === 0 ? "bg-bg" : "bg-surface/30"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-muted">
                            {s.id.slice(0, 8)}…
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted">
                          {s.user_id?.slice(0, 8)}…
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="brand">{s.plan_id}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={subBadge(s.status)}>{s.status}</Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                          {s.current_period_end
                            ? formatDateBR(s.current_period_end)
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {s.cancel_at_period_end ? (
                            <Badge variant="warning">Ao fim do período</Badge>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </Suspense>
      </section>

      {/* Pending webhooks section */}
      {pendingWebhooks.length > 0 && (
        <section aria-labelledby="webhooks-heading">
          <h2
            id="webhooks-heading"
            className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted"
          >
            Webhooks pendentes ({pendingWebhooks.length})
          </h2>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table
                className="w-full text-sm"
                role="table"
                aria-label="Webhooks pendentes de processamento"
              >
                <thead>
                  <tr className="border-b border-border bg-surface text-left">
                    <th scope="col" className="px-4 py-3 font-medium text-muted">ID</th>
                    <th scope="col" className="px-4 py-3 font-medium text-muted">Provedor</th>
                    <th scope="col" className="px-4 py-3 font-medium text-muted">Tipo</th>
                    <th scope="col" className="px-4 py-3 font-medium text-muted">Recebido</th>
                    <th scope="col" className="px-4 py-3 font-medium text-muted">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingWebhooks.map((wh, i) => (
                    <tr
                      key={wh.id}
                      className={`border-b border-border last:border-0 transition-colors hover:bg-surface/60 ${
                        i % 2 === 0 ? "bg-bg" : "bg-surface/30"
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted">
                        {wh.id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">{wh.provider}</td>
                      <td className="px-4 py-3">
                        <Badge variant="neutral">{wh.type}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                        <time dateTime={wh.created_at}>{formatDateBR(wh.created_at)}</time>
                      </td>
                      <td className="px-4 py-3">
                        <ResendWebhookButton webhookEventId={wh.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <Card className="animate-pulse p-4">
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 rounded bg-surface" />
        ))}
      </div>
    </Card>
  );
}
