import { Suspense } from "react";
import {
  Users,
  CreditCard,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Database,
  Mail,
  Webhook,
  Shield,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/admin/StatCard";
import { AdminDiagnosticButton } from "./AdminDiagnosticButton";

export const metadata = { title: "Visão Geral — Admin" };
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Data fetching (server-side, admin client bypasses RLS)
// ---------------------------------------------------------------------------

async function fetchKPIs() {
  const supabase = createAdminClient();
  const now = new Date();
  const minus24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [totalUsers, paidUsers, runs24h, errors24h] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("tool_runs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", minus24h),
    supabase
      .from("error_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", minus24h),
  ]);

  return {
    totalUsers: totalUsers.count ?? 0,
    paidUsers: paidUsers.count ?? 0,
    runs24h: runs24h.count ?? 0,
    errors24h: errors24h.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Health placeholder — real checks would hit external APIs server-side
// ---------------------------------------------------------------------------

type IntegrationStatus = "ok" | "degraded" | "down" | "unknown";

interface Integration {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  status: IntegrationStatus;
  note?: string;
}

const INTEGRATIONS: Integration[] = [
  { name: "Supabase DB", icon: Database, status: "ok", note: "Conexão ativa" },
  { name: "Supabase Auth", icon: Shield, status: "ok", note: "Conexão ativa" },
  { name: "Supabase Storage", icon: Database, status: "ok", note: "Conexão ativa" },
  { name: "E-mail (Resend)", icon: Mail, status: "unknown", note: "Verificação manual" },
  { name: "Webhooks", icon: Webhook, status: "unknown", note: "Verificação manual" },
];

const statusConfig: Record<
  IntegrationStatus,
  { label: string; icon: typeof CheckCircle2; className: string; badge: "success" | "warning" | "danger" | "neutral" }
> = {
  ok: { label: "Operacional", icon: CheckCircle2, className: "text-success-500", badge: "success" },
  degraded: { label: "Degradado", icon: AlertTriangle, className: "text-warning-500", badge: "warning" },
  down: { label: "Fora do ar", icon: XCircle, className: "text-danger-500", badge: "danger" },
  unknown: { label: "Desconhecido", icon: AlertTriangle, className: "text-muted", badge: "neutral" },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminPage() {
  const kpis = await fetchKPIs();

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-fg">Visão Geral</h1>
        <p className="mt-1 text-sm text-muted">
          Indicadores em tempo real e estado das integrações.
        </p>
      </div>

      {/* KPIs */}
      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">
          Indicadores-chave
        </h2>
        <Suspense fallback={<KPISkeleton />}>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Total de usuários"
              value={kpis.totalUsers.toLocaleString("pt-BR")}
              icon={Users}
              description="Todos os perfis registrados"
            />
            <StatCard
              label="Assinantes ativos"
              value={kpis.paidUsers.toLocaleString("pt-BR")}
              icon={CreditCard}
              variant="success"
              description="Planos com status ativo"
            />
            <StatCard
              label="Execuções (24h)"
              value={kpis.runs24h.toLocaleString("pt-BR")}
              icon={Zap}
              variant="default"
              description="Ferramentas rodadas nas últimas 24h"
            />
            <StatCard
              label="Erros (24h)"
              value={kpis.errors24h.toLocaleString("pt-BR")}
              icon={AlertTriangle}
              variant={kpis.errors24h > 10 ? "danger" : kpis.errors24h > 0 ? "warning" : "success"}
              description="Erros registrados nas últimas 24h"
            />
          </div>
        </Suspense>
      </section>

      {/* Saúde das integrações */}
      <section aria-labelledby="integrations-heading">
        <h2
          id="integrations-heading"
          className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted"
        >
          Saúde das integrações
        </h2>
        <Card>
          <ul className="divide-y divide-border" role="list">
            {INTEGRATIONS.map((integration) => {
              const cfg = statusConfig[integration.status];
              const Icon = integration.icon;
              const StatusIcon = cfg.icon;
              return (
                <li
                  key={integration.name}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted" aria-hidden />
                    <span className="text-sm font-medium text-fg">{integration.name}</span>
                    {integration.note && (
                      <span className="hidden text-xs text-muted sm:inline">{integration.note}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusIcon className={`h-4 w-4 ${cfg.className}`} aria-hidden />
                    <Badge variant={cfg.badge}>{cfg.label}</Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      {/* Diagnóstico rápido */}
      <section aria-labelledby="diag-heading">
        <h2
          id="diag-heading"
          className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted"
        >
          Diagnóstico rápido
        </h2>
        <Card>
          <CardTitle className="mb-1">Atalhos de diagnóstico</CardTitle>
          <CardDescription className="mb-5">
            Ações que chamam endpoints internos para inspecionar o estado do sistema.
          </CardDescription>

          <div className="flex flex-wrap gap-3">
            <AdminDiagnosticButton
              label="Verificar jobs pendentes"
              icon={RefreshCw}
              endpoint="/api/admin/jobs/check"
              successMessage="Jobs verificados com sucesso."
            />
            <AdminDiagnosticButton
              label="Limpar arquivos expirados"
              icon={Database}
              endpoint="/api/admin/storage/cleanup"
              successMessage="Limpeza iniciada."
              confirmImpact="Remove arquivos gerados expirados do storage. Irreversível."
            />
            <AdminDiagnosticButton
              label="Forçar sync de créditos"
              icon={CreditCard}
              endpoint="/api/admin/credits/sync"
              successMessage="Sincronização iniciada."
            />
            <AdminDiagnosticButton
              label="Testar envio de e-mail"
              icon={Mail}
              endpoint="/api/admin/email/test"
              successMessage="E-mail de teste enviado."
            />
          </div>
        </Card>
      </section>
    </div>
  );
}

function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <div className="h-4 w-24 rounded bg-surface" />
          <div className="mt-4 h-8 w-16 rounded bg-surface" />
        </Card>
      ))}
    </div>
  );
}
