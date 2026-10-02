import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { History, Heart, Zap, FileOutput, ArrowRight, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/app/EmptyState";
import { TOOLS_BY_SLUG } from "@/lib/tools/registry";
import { formatDateBR, formatBytes } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Visão geral da sua conta Praticca.",
};

const QUICK_TOOLS = [
  "comprimir-pdf",
  "juntar-pdf",
  "comprimir-imagem",
  "remover-fundo",
  "ocr",
  "gerador-de-documentos",
];

const PLAN_LABEL: Record<string, string> = {
  free: "Gratuito",
  pro: "Pro",
  ultra: "Ultra",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar?next=/dashboard");

  const [
    { data: profile },
    { data: credits },
    { data: recentRuns },
    { data: recentFiles },
  ] = await Promise.all([
    supabase.from("profiles").select("display_name, plan").eq("id", user.id).single(),
    supabase.from("credits").select("balance").eq("user_id", user.id).single(),
    supabase
      .from("tool_runs")
      .select("id, tool_slug, status, created_at, credits_spent")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("generated_files")
      .select("id, storage_path, mime, size_bytes, expires_at")
      .eq("user_id", user.id)
      .order("expires_at", { ascending: true })
      .limit(4),
  ]);

  const plan = profile?.plan ?? "free";
  const balance = credits?.balance ?? 0;
  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "Você";

  const now = new Date();
  const expiringFiles = (recentFiles ?? []).filter((f) => {
    if (!f.expires_at) return false;
    const exp = new Date(f.expires_at as string);
    return exp > now;
  });

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-2xl font-bold text-fg">
          Olá, {displayName.split(" ")[0]}!
        </h1>
        <p className="mt-1 text-sm text-muted">Aqui está um resumo da sua conta.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {/* Credits */}
        <Card className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted uppercase tracking-wider">
            <Zap className="h-3.5 w-3.5 text-warning-500" aria-hidden />
            Créditos
          </span>
          <p className="text-3xl font-bold text-fg">{balance}</p>
          <p className="text-xs text-muted">disponíveis</p>
          <Link href="/precos" className="mt-2 text-xs font-medium text-brand-500 hover:underline">
            Comprar mais
          </Link>
        </Card>

        {/* Plan */}
        <Card className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">Plano</span>
          <p className="text-3xl font-bold text-fg">{PLAN_LABEL[plan] ?? plan}</p>
          <p className="text-xs text-muted">atual</p>
          {plan === "free" && (
            <Link href="/precos" className="mt-2 text-xs font-medium text-brand-500 hover:underline">
              Fazer upgrade
            </Link>
          )}
        </Card>

        {/* Runs */}
        <Card className="col-span-2 flex flex-col gap-1 sm:col-span-1">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted uppercase tracking-wider">
            <History className="h-3.5 w-3.5" aria-hidden />
            Execuções
          </span>
          <p className="text-3xl font-bold text-fg">{recentRuns?.length ?? 0}</p>
          <p className="text-xs text-muted">recentes</p>
          <Link href="/historico" className="mt-2 text-xs font-medium text-brand-500 hover:underline">
            Ver histórico completo
          </Link>
        </Card>
      </div>

      {/* Recent tool runs */}
      <section aria-labelledby="recent-runs-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent-runs-heading" className="font-display text-base font-semibold text-fg">
            Ferramentas usadas recentemente
          </h2>
          <Link href="/historico" className="flex items-center gap-1 text-sm text-brand-500 hover:underline">
            Ver tudo <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        {!recentRuns || recentRuns.length === 0 ? (
          <EmptyState
            icon={<History className="h-5 w-5" />}
            title="Nenhuma execução ainda"
            description="Use qualquer ferramenta e ela aparecerá aqui."
            action={
              <Link href="/ferramentas">
                <Button size="sm">Explorar ferramentas</Button>
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface" role="list">
            {recentRuns.map((run) => {
              const tool = TOOLS_BY_SLUG[run.tool_slug as string];
              return (
                <li key={run.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">
                      {tool?.name ?? run.tool_slug}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted">
                      <Clock className="h-3 w-3" aria-hidden />
                      {formatDateBR(run.created_at as string)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {(run.credits_spent as number) > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-muted">
                        <Zap className="h-3 w-3 text-warning-500" aria-hidden />
                        {run.credits_spent}
                      </span>
                    )}
                    <Badge
                      variant={
                        run.status === "completed"
                          ? "success"
                          : run.status === "failed"
                          ? "danger"
                          : "neutral"
                      }
                    >
                      {run.status === "completed"
                        ? "Concluído"
                        : run.status === "failed"
                        ? "Falhou"
                        : "Processando"}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Expiring files */}
      {expiringFiles.length > 0 && (
        <section aria-labelledby="files-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="files-heading" className="font-display text-base font-semibold text-fg">
              Arquivos gerados expirando em breve
            </h2>
          </div>
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface" role="list">
            {expiringFiles.map((f) => {
              const fileName = (f.storage_path as string).split("/").pop() ?? "arquivo";
              return (
                <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileOutput className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                    <p className="truncate text-sm text-fg">{fileName}</p>
                    <span className="shrink-0 text-xs text-muted">
                      {formatBytes(f.size_bytes as number)}
                    </span>
                  </div>
                  <p className="shrink-0 text-xs text-warning-500">
                    Expira {formatDateBR(f.expires_at as string)}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Quick access shortcuts */}
      <section aria-labelledby="shortcuts-heading">
        <h2 id="shortcuts-heading" className="mb-3 font-display text-base font-semibold text-fg">
          Atalhos rápidos
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_TOOLS.map((slug) => {
            const tool = TOOLS_BY_SLUG[slug];
            if (!tool) return null;
            return (
              <Link
                key={slug}
                href={`/ferramentas/${slug}`}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="text-lg font-medium text-fg">{tool.name}</span>
                <span className="text-xs text-muted">{tool.shortDescription.split(" ").slice(0, 4).join(" ")}…</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Favorites teaser */}
      <section aria-labelledby="favs-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="favs-heading" className="font-display text-base font-semibold text-fg">
            Favoritos
          </h2>
          <Link href="/favoritos" className="flex items-center gap-1 text-sm text-brand-500 hover:underline">
            Gerenciar <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        <Card className="flex items-center gap-3 text-muted">
          <Heart className="h-5 w-5 shrink-0" aria-hidden />
          <p className="text-sm">
            Salve suas ferramentas favoritas e acesse-as rapidamente em{" "}
            <Link href="/favoritos" className="font-medium text-brand-500 hover:underline">
              Favoritos
            </Link>
            .
          </p>
        </Card>
      </section>
    </div>
  );
}
