import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { History } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/app/EmptyState";
import { HistoricoList } from "@/components/app/HistoricoList";
import type { HistoricoRun, GeneratedFile } from "./types";

export const metadata: Metadata = {
  title: "Histórico",
  description: "Veja todas as execuções das ferramentas Praticca na sua conta.",
};

interface SearchParams {
  ferramenta?: string;
  status?: string;
  pagina?: string;
}

const PAGE_SIZE = 20;

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar?next=/historico");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.pagina ?? "1", 10));
  const filterTool = params.ferramenta ?? "";
  const filterStatus = params.status ?? "";

  let query = supabase
    .from("tool_runs")
    .select("id, tool_slug, status, options, credits_spent, created_at, expires_at", {
      count: "exact",
    })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (filterTool) query = query.eq("tool_slug", filterTool);
  if (filterStatus) query = query.eq("status", filterStatus);

  const { data: runs, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  // Fetch generated files linked to these runs for download/delete actions
  const runIds = (runs ?? []).map((r) => r.id as string);
  const { data: genFiles } = runIds.length
    ? await supabase
        .from("generated_files")
        .select("id, storage_path, size_bytes, mime, expires_at")
        .in("tool_run_id" as never, runIds)
    : { data: [] };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-fg">Histórico</h1>
        <p className="mt-1 text-sm text-muted">
          Todas as execuções das ferramentas na sua conta.
        </p>
      </div>

      {!runs || runs.length === 0 ? (
        <EmptyState
          icon={<History className="h-5 w-5" />}
          title="Nenhuma execução encontrada"
          description={
            filterTool || filterStatus
              ? "Tente ajustar os filtros acima."
              : "Use qualquer ferramenta e o histórico aparecerá aqui."
          }
        />
      ) : (
        <HistoricoList
          runs={runs as HistoricoRun[]}
          generatedFiles={(genFiles ?? []) as GeneratedFile[]}
          totalPages={totalPages}
          currentPage={page}
          filterTool={filterTool}
          filterStatus={filterStatus}
        />
      )}
    </div>
  );
}

