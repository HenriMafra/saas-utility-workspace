"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AdminLogTable, type AdminLogEntry } from "@/components/admin/AdminLogTable";
import { formatDateBR } from "@/lib/utils";

interface LogsClientProps {
  logs: AdminLogEntry[];
  initialLevel: string;
  initialCategory: string;
  initialFrom: string;
  initialTo: string;
}

const LEVEL_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "info", label: "Info" },
  { value: "debug", label: "Debug" },
  { value: "warning", label: "Atenção" },
  { value: "error", label: "Erro" },
] as const;

export function LogsClient({
  logs,
  initialLevel,
  initialCategory,
  initialFrom,
  initialTo,
}: LogsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [level, setLevel] = useState(initialLevel);
  const [category, setCategory] = useState(initialCategory);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);

  function applyFilters() {
    const params = new URLSearchParams();
    if (level && level !== "all") params.set("level", level);
    if (category.trim()) params.set("category", category.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") applyFilters();
  }

  // Resolve a log via API, then refresh server data
  const handleResolve = useCallback(
    async (id: string) => {
      const res = await fetch("/api/admin/logs/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Erro ao resolver log.");
      }
      startTransition(() => router.refresh());
    },
    [router],
  );

  // Export visible logs as CSV (client-side)
  function exportCSV() {
    if (logs.length === 0) {
      toast.error("Nenhum log para exportar.");
      return;
    }

    const COLS = [
      "id",
      "level",
      "category",
      "message",
      "friendly_message",
      "recommended_action",
      "detail",
      "created_at",
      "resolved",
      "entity_type",
      "entity_id",
    ] as const;

    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };

    const rows = [
      COLS.join(","),
      ...logs.map((l) => COLS.map((c) => escape(l[c as keyof AdminLogEntry])).join(",")),
    ];

    const csv = rows.join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const now = new Date();
    a.download = `praticca-logs-${now.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${logs.length} registros exportados.`);
  }

  return (
    <div className="space-y-5">
      {/* Filters bar */}
      <div
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4"
        role="search"
        aria-label="Filtros de log"
      >
        {/* Level */}
        <div className="flex flex-col gap-1">
          <label htmlFor="log-level" className="text-xs font-medium text-muted">
            Nível
          </label>
          <select
            id="log-level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-md border border-border bg-bg px-2 py-1.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Filtrar por nível"
          >
            {LEVEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div className="flex-1 min-w-[160px]">
          <Input
            label="Categoria"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ex.: auth, billing…"
            aria-label="Filtrar por categoria"
          />
        </div>

        {/* Date from */}
        <div className="flex flex-col gap-1">
          <label htmlFor="log-from" className="text-xs font-medium text-muted">
            De
          </label>
          <input
            id="log-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-border bg-bg px-2 py-1.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Data inicial"
          />
        </div>

        {/* Date to */}
        <div className="flex flex-col gap-1">
          <label htmlFor="log-to" className="text-xs font-medium text-muted">
            Até
          </label>
          <input
            id="log-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-border bg-bg px-2 py-1.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Data final"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Filter className="h-4 w-4" aria-hidden />}
            loading={isPending}
            onClick={applyFilters}
            aria-label="Aplicar filtros"
          >
            Filtrar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Download className="h-4 w-4" aria-hidden />}
            onClick={exportCSV}
            aria-label="Exportar logs como CSV"
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Summary */}
      <p className="text-xs text-muted" aria-live="polite">
        {isPending
          ? "Carregando…"
          : `${logs.length} registro${logs.length !== 1 ? "s" : ""} encontrado${logs.length !== 1 ? "s" : ""}`}
        {(level !== "all" || category || from || to) && (
          <> — filtros ativos</>
        )}
      </p>

      {/* Table */}
      <AdminLogTable
        logs={logs}
        onResolve={handleResolve}
        openHref={(entry) =>
          entry.entity_type === "profiles" && entry.entity_id
            ? `/admin/usuarios/${entry.entity_id}`
            : "#"
        }
      />
    </div>
  );
}
