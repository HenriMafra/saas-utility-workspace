"use client";

import { useState } from "react";
import { PauseCircle, CheckCircle2, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { TOOLS } from "@/lib/tools/registry";
import type { ToolDef } from "@/lib/tools/registry";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ToolStatus = "active" | "paused" | "hidden" | "beta";

interface EditableRow {
  slug: string;
  status: ToolStatus;
  credit_cost: number;
  is_premium: boolean;
  dirty: boolean;
}

const statusConfig: Record<
  ToolStatus,
  { label: string; badge: "success" | "warning" | "neutral" | "brand"; icon: typeof CheckCircle2 }
> = {
  active:  { label: "Ativa",    badge: "success",  icon: CheckCircle2 },
  beta:    { label: "Beta",     badge: "brand",    icon: CheckCircle2 },
  paused:  { label: "Pausada",  badge: "warning",  icon: PauseCircle  },
  hidden:  { label: "Oculta",   badge: "neutral",  icon: EyeOff       },
};

function initRows(tools: ToolDef[]): EditableRow[] {
  return tools.map((t) => ({
    slug: t.slug,
    status: t.status as ToolStatus,
    credit_cost: t.creditCost,
    is_premium: t.isPremium,
    dirty: false,
  }));
}

export default function FerramentasAdminPage() {
  const [rows, setRows] = useState<EditableRow[]>(() => initRows(TOOLS));
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [confirmSlug, setConfirmSlug] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmImpact, setConfirmImpact] = useState("");
  const [search, setSearch] = useState("");

  const filtered = rows.filter(
    (r) =>
      search.trim() === "" ||
      r.slug.toLowerCase().includes(search.toLowerCase()) ||
      TOOLS.find((t) => t.slug === r.slug)?.name.toLowerCase().includes(search.toLowerCase()),
  );

  function patch(slug: string, changes: Partial<EditableRow>) {
    setRows((prev) =>
      prev.map((r) => (r.slug === slug ? { ...r, ...changes, dirty: true } : r)),
    );
  }

  async function save(slug: string) {
    const row = rows.find((r) => r.slug === slug);
    if (!row) return;

    setSaving((prev) => new Set(prev).add(slug));
    try {
      const res = await fetch("/api/admin/update-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          status: row.status,
          credit_cost: row.credit_cost,
          is_premium: row.is_premium,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao salvar.");
      }
      setRows((prev) =>
        prev.map((r) => (r.slug === slug ? { ...r, dirty: false } : r)),
      );
      toast.success(`Ferramenta "${slug}" atualizada.`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(slug);
        return next;
      });
    }
  }

  function requestStatusChange(slug: string, next: ToolStatus) {
    const sensitive = next === "paused" || next === "hidden";
    if (sensitive) {
      setConfirmSlug(slug);
      setConfirmTitle(
        next === "paused" ? `Pausar ferramenta "${slug}"?` : `Ocultar ferramenta "${slug}"?`,
      );
      setConfirmImpact(
        next === "paused"
          ? "A ferramenta ficará indisponível para novos usuários enquanto pausada."
          : "A ferramenta ficará completamente oculta do catálogo e de links diretos.",
      );
      setConfirmAction(() => () => {
        patch(slug, { status: next });
        setConfirmSlug(null);
      });
    } else {
      patch(slug, { status: next });
    }
  }

  const STATUS_OPTIONS: ToolStatus[] = ["active", "beta", "paused", "hidden"];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-fg">Ferramentas</h1>
          <p className="mt-1 text-sm text-muted">
            Gerencie status, custo em créditos e nível premium de cada ferramenta.
          </p>
        </div>
        <Badge variant="neutral">{TOOLS.length} ferramentas</Badge>
      </div>

      {/* Busca */}
      <Input
        label=""
        placeholder="Buscar por slug ou nome…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Filtrar ferramentas"
      />

      {/* Tabela */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm" aria-label="Lista de ferramentas">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-4 py-3 text-left font-semibold text-fg">Ferramenta</th>
                <th className="px-4 py-3 text-left font-semibold text-fg">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-fg">Créditos</th>
                <th className="px-4 py-3 text-left font-semibold text-fg">Premium</th>
                <th className="px-4 py-3 text-right font-semibold text-fg">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((row) => {
                const tool = TOOLS.find((t) => t.slug === row.slug)!;
                const isSaving = saving.has(row.slug);
                const cfg = statusConfig[row.status];

                return (
                  <tr
                    key={row.slug}
                    className={cn(
                      "transition-colors hover:bg-surface/50",
                      row.dirty && "bg-warning-500/5",
                    )}
                  >
                    {/* Nome */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-fg">{tool.name}</span>
                        <span className="text-xs text-muted">{row.slug}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={row.status}
                          onChange={(e) => requestStatusChange(row.slug, e.target.value as ToolStatus)}
                          aria-label={`Status de ${tool.name}`}
                          className="rounded-md border border-border bg-bg px-2 py-1 text-sm text-fg focus-visible:border-brand-500 focus-visible:outline-none"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {statusConfig[s].label}
                            </option>
                          ))}
                        </select>
                        <Badge variant={cfg.badge}>{cfg.label}</Badge>
                      </div>
                    </td>

                    {/* Créditos */}
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={row.credit_cost}
                        onChange={(e) =>
                          patch(row.slug, { credit_cost: Math.max(0, parseInt(e.target.value, 10) || 0) })
                        }
                        aria-label={`Custo em créditos de ${tool.name}`}
                        className="w-20 rounded-md border border-border bg-bg px-2 py-1 text-sm text-fg focus-visible:border-brand-500 focus-visible:outline-none"
                      />
                    </td>

                    {/* Premium toggle */}
                    <td className="px-4 py-3">
                      <button
                        role="switch"
                        aria-checked={row.is_premium}
                        aria-label={`Marcar ${tool.name} como premium`}
                        onClick={() => patch(row.slug, { is_premium: !row.is_premium })}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                          row.is_premium ? "bg-brand-500" : "bg-border",
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
                            row.is_premium ? "translate-x-5" : "translate-x-0",
                          )}
                        />
                      </button>
                    </td>

                    {/* Salvar */}
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant={row.dirty ? "primary" : "secondary"}
                        disabled={!row.dirty || isSaving}
                        loading={isSaving}
                        onClick={() => save(row.slug)}
                        aria-label={`Salvar alterações de ${tool.name}`}
                      >
                        {row.dirty ? "Salvar" : "Salvo"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted">
                    Nenhuma ferramenta encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmSlug !== null}
        title={confirmTitle}
        impact={confirmImpact}
        onConfirm={() => {
          if (confirmAction) confirmAction();
        }}
        onClose={() => {
          setConfirmSlug(null);
          setConfirmAction(null);
        }}
      />
    </div>
  );
}
