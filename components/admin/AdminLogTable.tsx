"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Copy, ExternalLink, AlertTriangle, Info, XCircle, Bug } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn, formatDateBR } from "@/lib/utils";

export type LogLevel = "info" | "warning" | "error" | "debug";

export interface AdminLogEntry {
  id: string;
  level: LogLevel;
  category: string;
  message: string;
  friendly_message?: string;
  recommended_action?: string;
  detail?: string;
  created_at: string;
  resolved?: boolean;
  entity_id?: string;
  entity_type?: string;
}

interface AdminLogTableProps {
  logs: AdminLogEntry[];
  onResolve?: (id: string) => Promise<void>;
  openHref?: (entry: AdminLogEntry) => string;
}

const levelConfig: Record<
  LogLevel,
  { label: string; icon: typeof Info; badgeVariant: "neutral" | "brand" | "success" | "warning" | "danger" }
> = {
  info: { label: "Info", icon: Info, badgeVariant: "neutral" },
  debug: { label: "Debug", icon: Bug, badgeVariant: "brand" },
  warning: { label: "Atenção", icon: AlertTriangle, badgeVariant: "warning" },
  error: { label: "Erro", icon: XCircle, badgeVariant: "danger" },
};

function LevelBadge({ level }: { level: LogLevel }) {
  const cfg = levelConfig[level];
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.badgeVariant} className="inline-flex items-center gap-1">
      <Icon className="h-3 w-3" aria-hidden />
      {cfg.label}
    </Badge>
  );
}

export function AdminLogTable({ logs, onResolve, openHref }: AdminLogTableProps) {
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  async function handleResolve(entry: AdminLogEntry) {
    if (!onResolve) return;
    setResolvingId(entry.id);
    try {
      await onResolve(entry.id);
      toast.success("Log marcado como resolvido.");
    } catch {
      toast.error("Não foi possível resolver. Tente novamente.");
    } finally {
      setResolvingId(null);
    }
  }

  async function handleCopy(entry: AdminLogEntry) {
    const text = JSON.stringify(
      {
        id: entry.id,
        level: entry.level,
        category: entry.category,
        message: entry.message,
        detail: entry.detail,
        created_at: entry.created_at,
      },
      null,
      2,
    );
    await navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência.");
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted" role="status">
        <CheckCircle2 className="mb-3 h-8 w-8 text-success-500" aria-hidden />
        <p className="text-sm">Nenhum log encontrado.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm" role="table" aria-label="Logs do sistema">
        <thead>
          <tr className="border-b border-border bg-surface text-left">
            <th scope="col" className="px-4 py-3 font-medium text-muted">Nível</th>
            <th scope="col" className="px-4 py-3 font-medium text-muted">Categoria</th>
            <th scope="col" className="px-4 py-3 font-medium text-muted">Mensagem</th>
            <th scope="col" className="px-4 py-3 font-medium text-muted">Ação recomendada</th>
            <th scope="col" className="px-4 py-3 font-medium text-muted">Data</th>
            <th scope="col" className="px-4 py-3 font-medium text-muted">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((entry, i) => (
            <tr
              key={entry.id}
              className={cn(
                "border-b border-border last:border-0 transition-colors hover:bg-surface/60",
                entry.resolved && "opacity-50",
                i % 2 === 0 ? "bg-bg" : "bg-surface/30",
              )}
            >
              <td className="px-4 py-3 align-top">
                <LevelBadge level={entry.level} />
              </td>
              <td className="px-4 py-3 align-top">
                <span className="font-mono text-xs text-muted">{entry.category}</span>
              </td>
              <td className="max-w-xs px-4 py-3 align-top">
                <p className="font-medium text-fg">
                  {entry.friendly_message || entry.message}
                </p>
                {entry.detail && (
                  <p className="mt-0.5 font-mono text-xs text-muted line-clamp-2">{entry.detail}</p>
                )}
              </td>
              <td className="max-w-xs px-4 py-3 align-top">
                {entry.recommended_action ? (
                  <p className="text-xs text-muted">{entry.recommended_action}</p>
                ) : (
                  <span className="text-xs text-muted/40">—</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-muted">
                <time dateTime={entry.created_at}>{formatDateBR(entry.created_at)}</time>
              </td>
              <td className="px-4 py-3 align-top">
                <div className="flex items-center gap-1">
                  {onResolve && !entry.resolved && (
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={resolvingId === entry.id}
                      onClick={() => handleResolve(entry)}
                      aria-label={`Resolver log: ${entry.friendly_message || entry.message}`}
                      title="Marcar como resolvido"
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(entry)}
                    aria-label="Copiar detalhes do log"
                    title="Copiar detalhes"
                  >
                    <Copy className="h-4 w-4" aria-hidden />
                  </Button>
                  {openHref && (
                    <a
                      href={openHref(entry)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      aria-label={`Abrir entidade relacionada ao log ${entry.id}`}
                      title="Abrir entidade"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden />
                    </a>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
