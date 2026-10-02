import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, UserCheck, UserX, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { formatDateBR } from "@/lib/utils";

export const metadata = { title: "Usuários — Admin" };
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PLAN_BADGE: Record<string, "neutral" | "brand" | "success" | "warning"> = {
  free: "neutral",
  pro: "brand",
  premium: "success",
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function fetchUsers(query: string) {
  const admin = createAdminClient();

  let q = admin
    .from("profiles")
    .select("id, display_name, plan, is_admin, locale, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (query.trim()) {
    q = q.or(
      `display_name.ilike.%${query}%,id.eq.${query}`,
    );
  }

  const { data, error } = await q;
  if (error) return [];
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // Auth guard (layout already checks, but just in case)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/usuarios");

  const { q = "" } = await searchParams;
  const users = await fetchUsers(q);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-fg">Usuários</h1>
          <p className="mt-1 text-sm text-muted">
            {users.length} resultado{users.length !== 1 ? "s" : ""} encontrado
            {users.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Search */}
      <form method="GET" action="/admin/usuarios" role="search" aria-label="Buscar usuário">
        <div className="flex max-w-md items-center gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Buscar por nome ou UUID…"
              aria-label="Buscar usuário"
              className="pl-9"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Buscar
          </button>
        </div>
      </form>

      {/* Table */}
      <Suspense fallback={<TableSkeleton />}>
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table
              className="w-full text-sm"
              role="table"
              aria-label="Lista de usuários"
            >
              <thead>
                <tr className="border-b border-border bg-surface text-left">
                  <th scope="col" className="px-4 py-3 font-medium text-muted">
                    Nome / ID
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-muted">
                    Plano
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-muted">
                    Tipo
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-muted">
                    Cadastro
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-muted">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-sm text-muted"
                    >
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : (
                  users.map((u, i) => (
                    <tr
                      key={u.id}
                      className={`border-b border-border last:border-0 transition-colors hover:bg-surface/60 ${
                        i % 2 === 0 ? "bg-bg" : "bg-surface/30"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-fg">
                          {u.display_name ?? "(sem nome)"}
                        </p>
                        <p className="font-mono text-xs text-muted">{u.id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={PLAN_BADGE[u.plan ?? "free"] ?? "neutral"}
                        >
                          {u.plan ?? "free"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {u.is_admin ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-500">
                            <UserCheck className="h-3.5 w-3.5" aria-hidden />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted">
                            <UserX className="h-3.5 w-3.5" aria-hidden />
                            Usuário
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                        <time dateTime={u.created_at}>
                          {formatDateBR(u.created_at)}
                        </time>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/usuarios/${u.id}`}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-500 transition-colors hover:bg-brand-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                          aria-label={`Ver detalhes de ${u.display_name ?? u.id}`}
                        >
                          Detalhes
                          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </Suspense>
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
