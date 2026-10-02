import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Zap, CreditCard, Calendar, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateBR, formatBRL } from "@/lib/utils";
import { UserActionsPanel } from "./UserActionsPanel";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Usuário ${id.slice(0, 8)}… — Admin` };
}

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

async function fetchUserData(userId: string) {
  const admin = createAdminClient();

  const [profileRes, creditsRes, subsRes, runsRes, authRes] = await Promise.all([
    admin
      .from("profiles")
      .select("id, display_name, plan, is_admin, locale, created_at")
      .eq("id", userId)
      .single(),
    admin
      .from("credits")
      .select("balance")
      .eq("user_id", userId)
      .single(),
    admin
      .from("subscriptions")
      .select("id, plan_id, status, current_period_end, cancel_at_period_end, provider_subscription_id")
      .eq("user_id", userId)
      .order("current_period_end", { ascending: false })
      .limit(5),
    admin
      .from("tool_runs")
      .select("id, tool_slug, status, credits_spent, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
    admin.auth.admin.getUserById(userId),
  ]);

  if (profileRes.error) return null;

  return {
    profile: profileRes.data,
    credits: creditsRes.data?.balance ?? 0,
    subscriptions: subsRes.data ?? [],
    runs: runsRes.data ?? [],
    authUser: authRes.data?.user ?? null,
  };
}

// ---------------------------------------------------------------------------
// Helpers UI
// ---------------------------------------------------------------------------

const SUB_STATUS_BADGE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  active: "success",
  trialing: "brand" as never,
  past_due: "warning",
  canceled: "danger",
  incomplete: "neutral",
};

const RUN_STATUS_BADGE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  success: "success",
  processing: "warning",
  error: "danger",
  queued: "neutral",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminUsuarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user: me },
  } = await supabase.auth.getUser();
  if (!me) redirect("/login?next=/admin/usuarios");

  const { id } = await params;
  const data = await fetchUserData(id);
  if (!data) notFound();

  const { profile, credits, subscriptions, runs, authUser } = data;
  const isBanned = !!authUser?.banned_until;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Back + header */}
      <div>
        <Link
          href="/admin/usuarios"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Voltar para usuários
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-fg">
              {profile.display_name ?? "(sem nome)"}
            </h1>
            <p className="mt-0.5 font-mono text-xs text-muted">{profile.id}</p>
          </div>
          <div className="flex items-center gap-2">
            {isBanned && (
              <Badge variant="danger">
                <ShieldAlert className="mr-1 h-3 w-3" aria-hidden />
                Bloqueado
              </Badge>
            )}
            {profile.is_admin && <Badge variant="brand">Admin</Badge>}
            <Badge variant={
              profile.plan === "pro" ? "brand" : profile.plan === "premium" ? "success" : "neutral"
            }>
              {profile.plan ?? "free"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — info + actions */}
        <div className="space-y-5 lg:col-span-2">
          {/* Info card */}
          <Card>
            <CardTitle className="mb-4">Informações gerais</CardTitle>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-muted">E-mail</dt>
                <dd className="font-medium text-fg">{authUser?.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Locale</dt>
                <dd className="font-medium text-fg">{profile.locale ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Cadastro</dt>
                <dd className="font-medium text-fg">
                  {formatDateBR(profile.created_at)}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Último login</dt>
                <dd className="font-medium text-fg">
                  {authUser?.last_sign_in_at
                    ? formatDateBR(authUser.last_sign_in_at)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Créditos</dt>
                <dd className="font-bold text-brand-500">{credits.toLocaleString("pt-BR")}</dd>
              </div>
              <div>
                <dt className="text-muted">Status auth</dt>
                <dd>
                  <Badge variant={isBanned ? "danger" : "success"}>
                    {isBanned ? "Bloqueado" : "Ativo"}
                  </Badge>
                </dd>
              </div>
            </dl>
          </Card>

          {/* Subscriptions */}
          <Card>
            <CardTitle className="mb-1 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted" aria-hidden />
              Assinaturas
            </CardTitle>
            <CardDescription className="mb-4">
              Últimas {subscriptions.length} assinaturas registradas.
            </CardDescription>
            {subscriptions.length === 0 ? (
              <p className="text-sm text-muted">Nenhuma assinatura.</p>
            ) : (
              <ul className="divide-y divide-border" role="list">
                {subscriptions.map((sub) => (
                  <li key={sub.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-fg">
                        Plano <span className="font-mono text-xs">{sub.plan_id}</span>
                      </p>
                      <p className="text-xs text-muted">
                        {sub.provider_subscription_id ?? "—"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={SUB_STATUS_BADGE[sub.status] ?? "neutral"}>
                        {sub.status}
                      </Badge>
                      {sub.current_period_end && (
                        <p className="text-xs text-muted">
                          <Calendar className="mr-0.5 inline h-3 w-3" aria-hidden />
                          {formatDateBR(sub.current_period_end)}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Recent runs */}
          <Card>
            <CardTitle className="mb-1 flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted" aria-hidden />
              Execuções recentes
            </CardTitle>
            <CardDescription className="mb-4">
              Últimas {runs.length} execuções de ferramentas.
            </CardDescription>
            {runs.length === 0 ? (
              <p className="text-sm text-muted">Nenhuma execução.</p>
            ) : (
              <div className="overflow-x-auto">
                <table
                  className="w-full text-sm"
                  role="table"
                  aria-label="Execuções recentes do usuário"
                >
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th scope="col" className="pb-2 font-medium text-muted">Ferramenta</th>
                      <th scope="col" className="pb-2 font-medium text-muted">Status</th>
                      <th scope="col" className="pb-2 font-medium text-muted">Créditos</th>
                      <th scope="col" className="pb-2 font-medium text-muted">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((run) => (
                      <tr
                        key={run.id}
                        className="border-b border-border last:border-0 hover:bg-surface/40"
                      >
                        <td className="py-2 pr-4 font-mono text-xs">{run.tool_slug}</td>
                        <td className="py-2 pr-4">
                          <Badge variant={RUN_STATUS_BADGE[run.status] ?? "neutral"}>
                            {run.status}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4 text-xs text-muted">
                          {run.credits_spent ?? 0}
                        </td>
                        <td className="whitespace-nowrap py-2 text-xs text-muted">
                          <time dateTime={run.created_at}>{formatDateBR(run.created_at)}</time>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right column — actions */}
        <div className="lg:col-span-1">
          <UserActionsPanel
            userId={id}
            currentCredits={credits}
            isBanned={isBanned}
          />
        </div>
      </div>
    </div>
  );
}
