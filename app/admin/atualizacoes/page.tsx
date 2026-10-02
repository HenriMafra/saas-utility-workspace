import {
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Terminal,
  Package,
  FileText,
  Database,
  Zap,
  Shield,
  ClipboardList,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AdminDiagnosticButton } from "../AdminDiagnosticButton";
import { readFileSync } from "fs";
import { join } from "path";

export const metadata = { title: "Atualizações — Admin" };
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Read version from package.json (server-side)
// ---------------------------------------------------------------------------

function getAppVersion(): { version: string; name: string } {
  try {
    const raw = readFileSync(join(process.cwd(), "package.json"), "utf-8");
    const pkg = JSON.parse(raw) as { version?: string; name?: string };
    return { version: pkg.version ?? "0.0.0", name: pkg.name ?? "praticca" };
  } catch {
    return { version: "0.0.0", name: "praticca" };
  }
}

// ---------------------------------------------------------------------------
// Changelog (static placeholder — replace with DB or file source)
// ---------------------------------------------------------------------------

interface ChangelogEntry {
  version: string;
  date: string;
  type: "feature" | "fix" | "breaking" | "infra";
  items: string[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.1.0",
    date: "2026-06-01",
    type: "feature",
    items: [
      "Lançamento inicial da plataforma Praticca.",
      "15 ferramentas disponíveis: PDF, imagem, texto, negócios, cálculo e validação.",
      "Sistema de planos e assinaturas com Stripe.",
      "Painel administrativo completo.",
      "Auth com Supabase + Google OAuth.",
    ],
  },
];

// ---------------------------------------------------------------------------
// Fetch migrations applied
// ---------------------------------------------------------------------------

async function fetchMigrations(): Promise<Array<{ name: string; executed_at: string | null }>> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("schema_migrations")
      .select("name, executed_at")
      .order("executed_at", { ascending: false })
      .limit(20);
    return data ?? [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Post-deploy checklist (static)
// ---------------------------------------------------------------------------

const CHECKLIST = [
  { id: "smoke", label: "Testar ferramenta principal (comprimir-pdf) do início ao fim", icon: Zap },
  { id: "auth", label: "Verificar fluxo de login/cadastro em prod", icon: Shield },
  { id: "payment", label: "Executar compra de teste no Stripe (modo test)", icon: Package },
  { id: "email", label: "Confirmar envio de e-mail de boas-vindas", icon: FileText },
  { id: "logs", label: "Inspecionar error_logs nas últimas 24h", icon: AlertTriangle },
  { id: "storage", label: "Verificar arquivos expirados no storage", icon: Database },
  { id: "seo", label: "Checar robots.txt e sitemap.xml", icon: Terminal },
];

const typeConfig: Record<
  ChangelogEntry["type"],
  { label: string; badge: "success" | "brand" | "danger" | "neutral" }
> = {
  feature:  { label: "Feature",     badge: "success"  },
  fix:      { label: "Correção",    badge: "brand"    },
  breaking: { label: "Breaking",    badge: "danger"   },
  infra:    { label: "Infra",       badge: "neutral"  },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AtualizacoesPage() {
  const { version, name } = getAppVersion();
  const migrations = await fetchMigrations();

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-fg">Centro de Atualizações</h1>
        <p className="mt-1 text-sm text-muted">
          Versão atual, changelog, migrations aplicadas e checklist pós-deploy.
        </p>
      </div>

      {/* Versão atual */}
      <section aria-labelledby="version-heading">
        <h2 id="version-heading" className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">
          Versão atual
        </h2>
        <Card className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10">
              <Package className="h-6 w-6 text-brand-500" aria-hidden />
            </span>
            <div>
              <p className="font-display text-2xl font-bold text-fg tabular-nums">v{version}</p>
              <p className="text-sm text-muted">{name}</p>
            </div>
          </div>
          <Badge variant="success">Produção</Badge>
        </Card>
      </section>

      {/* Changelog */}
      <section aria-labelledby="changelog-heading">
        <h2 id="changelog-heading" className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">
          Changelog
        </h2>
        <div className="space-y-4">
          {CHANGELOG.map((entry) => {
            const cfg = typeConfig[entry.type];
            return (
              <Card key={entry.version} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-fg">v{entry.version}</span>
                    <Badge variant={cfg.badge}>{cfg.label}</Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
                      new Date(entry.date),
                    )}
                  </div>
                </div>
                <ul className="space-y-1.5" role="list">
                  {entry.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-500" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Migrations */}
      <section aria-labelledby="migrations-heading">
        <h2
          id="migrations-heading"
          className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted"
        >
          Migrations aplicadas
        </h2>
        <Card className="p-0 overflow-hidden">
          {migrations.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">
              Tabela <code className="rounded bg-surface px-1">schema_migrations</code> não encontrada ou vazia.
            </p>
          ) : (
            <ul className="divide-y divide-border" role="list">
              {migrations.map((m, i) => (
                <li key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                    <code className="text-sm font-mono text-fg">{m.name}</code>
                  </div>
                  {m.executed_at ? (
                    <span className="text-xs text-muted">
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(m.executed_at))}
                    </span>
                  ) : (
                    <Badge variant="warning">Pendente</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* Checklist pós-deploy */}
      <section aria-labelledby="checklist-heading">
        <h2
          id="checklist-heading"
          className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted"
        >
          Checklist pós-deploy
        </h2>
        <Card className="space-y-1">
          <CardTitle className="mb-1 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-brand-500" aria-hidden />
            Verificações recomendadas após cada deploy
          </CardTitle>
          <CardDescription className="mb-4">
            Marque mentalmente cada item após o deploy em produção.
          </CardDescription>
          <ul className="space-y-2" role="list">
            {CHECKLIST.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm text-fg"
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                  {item.label}
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      {/* Botões de diagnóstico */}
      <section aria-labelledby="diag-heading">
        <h2
          id="diag-heading"
          className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted"
        >
          Diagnóstico rápido
        </h2>
        <Card>
          <CardTitle className="mb-1">Ações de diagnóstico</CardTitle>
          <CardDescription className="mb-5">
            Chamam endpoints internos para inspecionar o estado do sistema.
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
              label="Testar envio de e-mail"
              icon={FileText}
              endpoint="/api/admin/email/test"
              successMessage="E-mail de teste enviado."
            />
            <AdminDiagnosticButton
              label="Sync de créditos"
              icon={Zap}
              endpoint="/api/admin/credits/sync"
              successMessage="Sincronização de créditos iniciada."
            />
          </div>
        </Card>
      </section>
    </div>
  );
}
