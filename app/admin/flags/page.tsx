"use client";

import { useEffect, useState } from "react";
import { Flag, RefreshCw, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FeatureFlag {
  key: string;
  enabled: boolean;
  rollout_percent: number;
  target?: string | null;
  description?: string | null;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function loadFlags(): Promise<FeatureFlag[]> {
  const res = await fetch("/api/admin/flags", { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

async function updateFlag(key: string, patch: Partial<FeatureFlag>): Promise<void> {
  const res = await fetch("/api/admin/update-flag", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, ...patch }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Erro ao atualizar flag.");
  }
}

// ---------------------------------------------------------------------------
// Inline rollout editor
// ---------------------------------------------------------------------------

function RolloutInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        disabled={disabled}
        aria-label="Porcentagem de rollout"
        className="h-2 w-28 cursor-pointer accent-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <span className="w-10 text-right tabular-nums text-sm font-medium text-fg">
        {value}%
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FlagsAdminPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Set<string>>(new Set());

  // Confirm disable
  const [confirmKey, setConfirmKey] = useState<string | null>(null);

  useEffect(() => {
    loadFlags()
      .then(setFlags)
      .finally(() => setLoading(false));
  }, []);

  async function toggleEnabled(key: string, next: boolean) {
    if (!next) {
      // Disabling a flag is sensitive
      setConfirmKey(key);
      return;
    }
    await doUpdate(key, { enabled: true });
  }

  async function doUpdate(key: string, patch: Partial<FeatureFlag>) {
    setSaving((prev) => new Set(prev).add(key));
    try {
      await updateFlag(key, patch);
      setFlags((prev) =>
        prev.map((f) => (f.key === key ? { ...f, ...patch } : f)),
      );
      toast.success(`Flag "${key}" atualizada.`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar.");
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" aria-hidden />
        Carregando feature flags…
      </div>
    );
  }

  if (flags.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="font-display text-2xl font-bold text-fg">Feature Flags</h1>
        <Card>
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Flag className="h-10 w-10 text-muted" aria-hidden />
            <p className="text-sm font-medium text-fg">Nenhuma flag cadastrada.</p>
            <p className="max-w-sm text-sm text-muted">
              Insira registros na tabela <code className="rounded bg-surface px-1">feature_flags</code> para
              gerenciá-los aqui.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-fg">Feature Flags</h1>
        <p className="mt-1 text-sm text-muted">
          Ative ou desative funcionalidades em produção com controle de rollout percentual.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 rounded-lg border border-border bg-surface px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
        <p className="text-sm text-muted">
          Alterações têm efeito imediato. O rollout percentual define a porcentagem de usuários que verão
          a funcionalidade quando a flag está ativa.
        </p>
      </div>

      {/* Flags */}
      <div className="space-y-3">
        {flags.map((flag) => {
          const isSaving = saving.has(flag.key);

          return (
            <Card key={flag.key} className="space-y-3">
              {/* Header da card */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-surface px-1.5 py-0.5 text-sm font-mono font-medium text-fg">
                      {flag.key}
                    </code>
                    <Badge variant={flag.enabled ? "success" : "neutral"}>
                      {flag.enabled ? "Ativa" : "Inativa"}
                    </Badge>
                    {flag.target && (
                      <Badge variant="brand">{flag.target}</Badge>
                    )}
                  </div>
                  {flag.description && (
                    <p className="mt-1 text-sm text-muted">{flag.description}</p>
                  )}
                </div>

                {/* Toggle */}
                <button
                  role="switch"
                  aria-checked={flag.enabled}
                  aria-label={`${flag.enabled ? "Desativar" : "Ativar"} flag ${flag.key}`}
                  disabled={isSaving}
                  onClick={() => toggleEnabled(flag.key, !flag.enabled)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    flag.enabled ? "bg-brand-500" : "bg-border",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
                      flag.enabled ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </button>
              </div>

              {/* Rollout */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                <div>
                  <p className="text-xs font-medium text-fg">Rollout gradual</p>
                  <p className="text-xs text-muted">
                    Porcentagem dos usuários elegíveis que verão esta feature.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <RolloutInput
                    value={flag.rollout_percent}
                    disabled={isSaving}
                    onChange={(v) =>
                      setFlags((prev) =>
                        prev.map((f) => (f.key === flag.key ? { ...f, rollout_percent: v } : f)),
                      )
                    }
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={isSaving}
                    onClick={() => doUpdate(flag.key, { rollout_percent: flag.rollout_percent })}
                    aria-label={`Salvar rollout de ${flag.key}`}
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Confirm desativar */}
      <ConfirmDialog
        open={confirmKey !== null}
        title={`Desativar flag "${confirmKey}"?`}
        impact="A funcionalidade será desativada imediatamente para todos os usuários, independente do rollout configurado."
        onConfirm={async () => {
          if (confirmKey) await doUpdate(confirmKey, { enabled: false });
          setConfirmKey(null);
        }}
        onClose={() => setConfirmKey(null)}
      />
    </div>
  );
}
