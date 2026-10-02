"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  Download,
  Trash2,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TOOLS, TOOLS_BY_SLUG } from "@/lib/tools/registry";
import { formatDateBR, formatBytes } from "@/lib/utils";
import type { HistoricoRun, GeneratedFile } from "@/app/(app)/historico/types";

interface Props {
  runs: HistoricoRun[];
  generatedFiles: GeneratedFile[];
  totalPages: number;
  currentPage: number;
  filterTool: string;
  filterStatus: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "completed", label: "Concluído" },
  { value: "failed", label: "Falhou" },
  { value: "processing", label: "Processando" },
];

const STATUS_BADGE: Record<string, "success" | "danger" | "neutral" | "warning"> = {
  completed: "success",
  failed: "danger",
  processing: "warning",
};

const STATUS_LABEL: Record<string, string> = {
  completed: "Concluído",
  failed: "Falhou",
  processing: "Processando",
};

export function HistoricoList({
  runs,
  generatedFiles,
  totalPages,
  currentPage,
  filterTool,
  filterStatus,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Build a URL with updated search params
  const buildUrl = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams],
  );

  function navigate(updates: Record<string, string>) {
    startTransition(() => {
      router.push(buildUrl(updates));
    });
  }

  // Build lookup: run_id -> generated files (currently no FK in the type, so we match by mime)
  // Since generated_files doesn't carry run_id in the select above, we just show files per-page
  const filesByRunId: Record<string, GeneratedFile[]> = {};
  generatedFiles.forEach((f) => {
    // Without a direct FK, we cannot match files to runs here.
    // The table relationship needs tool_run_id. We'll show files as a list at the run level.
    const path = f.storage_path ?? "";
    const runId = path.split("/")[1]; // storage_path pattern: user_id/run_id/filename
    if (runId) {
      filesByRunId[runId] ??= [];
      filesByRunId[runId].push(f);
    }
  });

  async function handleDelete(runId: string) {
    if (!confirm("Excluir este registro e arquivos associados? Esta ação não pode ser desfeita.")) return;
    setDeletingId(runId);
    const supabase = createClient();
    const { error } = await supabase.from("tool_runs").delete().eq("id", runId);
    setDeletingId(null);
    if (error) {
      toast.error("Não foi possível excluir. Tente novamente.");
    } else {
      toast.success("Registro excluído.");
      startTransition(() => router.refresh());
    }
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-3" role="search" aria-label="Filtrar histórico">
        {/* Tool filter */}
        <div>
          <label htmlFor="filter-tool" className="sr-only">
            Filtrar por ferramenta
          </label>
          <select
            id="filter-tool"
            value={filterTool}
            onChange={(e) => navigate({ ferramenta: e.target.value, pagina: "1" })}
            className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todas as ferramentas</option>
            {TOOLS.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div>
          <label htmlFor="filter-status" className="sr-only">
            Filtrar por status
          </label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => navigate({ status: e.target.value, pagina: "1" })}
            className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {(filterTool || filterStatus) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ ferramenta: "", status: "", pagina: "1" })}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Table */}
      <div className={`overflow-hidden rounded-xl border border-border bg-surface transition-opacity ${isPending ? "opacity-60" : ""}`}>
        <table className="w-full text-sm" aria-label="Histórico de execuções">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-medium text-muted">Ferramenta</th>
              <th className="hidden px-4 py-3 text-xs font-medium text-muted sm:table-cell">Data</th>
              <th className="px-4 py-3 text-xs font-medium text-muted">Status</th>
              <th className="hidden px-4 py-3 text-xs font-medium text-muted md:table-cell">Créditos</th>
              <th className="px-4 py-3 text-xs font-medium text-muted">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {runs.map((run) => {
              const tool = TOOLS_BY_SLUG[run.tool_slug];
              const files = filesByRunId[run.id] ?? [];
              const isDeleting = deletingId === run.id;

              return (
                <tr key={run.id} className="group hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/ferramentas/${run.tool_slug}`}
                      className="font-medium text-fg hover:text-brand-500 hover:underline"
                    >
                      {tool?.name ?? run.tool_slug}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-muted sm:table-cell">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {formatDateBR(run.created_at)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_BADGE[run.status] ?? "neutral"}>
                      {STATUS_LABEL[run.status] ?? run.status}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {run.credits_spent > 0 ? (
                      <span className="flex items-center gap-0.5 text-muted">
                        <Zap className="h-3 w-3 text-warning-500" aria-hidden />
                        {run.credits_spent}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {files.map((f) => (
                        <a
                          key={f.id}
                          href={`/api/files/${f.id}/download`}
                          download
                          aria-label={`Baixar ${f.storage_path.split("/").pop()} (${formatBytes(f.size_bytes)})`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-neutral-100 hover:text-fg dark:hover:bg-neutral-800"
                        >
                          <Download className="h-4 w-4" aria-hidden />
                        </a>
                      ))}
                      <button
                        onClick={() => void handleDelete(run.id)}
                        disabled={isDeleting}
                        aria-label="Excluir registro"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-danger-50 hover:text-danger-700 disabled:opacity-50 dark:hover:bg-danger-900/30"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="flex items-center justify-center gap-2"
          aria-label="Paginação do histórico"
        >
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => navigate({ pagina: String(currentPage - 1) })}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Anterior
          </Button>
          <span className="text-sm text-muted">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => navigate({ pagina: String(currentPage + 1) })}
            aria-label="Próxima página"
          >
            Próxima
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </nav>
      )}
    </div>
  );
}
