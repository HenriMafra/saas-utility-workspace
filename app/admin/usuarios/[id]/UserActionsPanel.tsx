"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  PlusCircle,
  MinusCircle,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface UserActionsPanelProps {
  userId: string;
  currentCredits: number;
  isBanned: boolean;
}

type DialogMode =
  | "grant-credits"
  | "revoke-credits"
  | "block"
  | "unblock"
  | "reset-limit"
  | null;

export function UserActionsPanel({
  userId,
  currentCredits,
  isBanned,
}: UserActionsPanelProps) {
  const router = useRouter();
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [creditAmount, setCreditAmount] = useState("50");
  const [loading, setLoading] = useState(false);

  async function callApi(
    endpoint: string,
    body: Record<string, unknown>,
  ): Promise<boolean> {
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error ?? "Erro ao executar ação.");
        return false;
      }
      return true;
    } catch {
      toast.error("Falha de rede. Tente novamente.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleGrantCredits(reason: string) {
    const delta = Math.abs(Number(creditAmount));
    if (!delta) { toast.error("Informe um valor válido."); return; }
    const ok = await callApi(`/api/admin/usuarios/${userId}/credits`, { delta, reason });
    if (ok) {
      toast.success(`+${delta} créditos concedidos.`);
      router.refresh();
    }
  }

  async function handleRevokeCredits(reason: string) {
    const delta = -Math.abs(Number(creditAmount));
    if (!delta) { toast.error("Informe um valor válido."); return; }
    const ok = await callApi(`/api/admin/usuarios/${userId}/credits`, { delta, reason });
    if (ok) {
      toast.success(`${Math.abs(delta)} créditos removidos.`);
      router.refresh();
    }
  }

  async function handleBlock(reason: string) {
    const ok = await callApi(`/api/admin/usuarios/${userId}/block`, {
      blocked: true,
      reason,
    });
    if (ok) {
      toast.success("Usuário bloqueado.");
      router.refresh();
    }
  }

  async function handleUnblock(reason: string) {
    const ok = await callApi(`/api/admin/usuarios/${userId}/block`, {
      blocked: false,
      reason,
    });
    if (ok) {
      toast.success("Usuário desbloqueado.");
      router.refresh();
    }
  }

  async function handleResetLimit(reason: string) {
    const ok = await callApi(`/api/admin/usuarios/${userId}/reset-limit`, { reason });
    if (ok) {
      toast.success("Limite mensal resetado.");
      router.refresh();
    }
  }

  function onConfirm(reason: string) {
    if (dialogMode === "grant-credits") return handleGrantCredits(reason);
    if (dialogMode === "revoke-credits") return handleRevokeCredits(reason);
    if (dialogMode === "block") return handleBlock(reason);
    if (dialogMode === "unblock") return handleUnblock(reason);
    if (dialogMode === "reset-limit") return handleResetLimit(reason);
  }

  const dialogConfig: Record<
    NonNullable<DialogMode>,
    { title: string; impact: string; requireText?: string }
  > = {
    "grant-credits": {
      title: `Conceder ${creditAmount} créditos`,
      impact: `Adicionará ${creditAmount} créditos ao saldo do usuário. Registrado no log de auditoria.`,
    },
    "revoke-credits": {
      title: `Remover ${creditAmount} créditos`,
      impact: `Removerá ${creditAmount} créditos do saldo (mínimo 0). Registrado no log de auditoria.`,
    },
    block: {
      title: "Bloquear usuário",
      impact:
        "O usuário perderá acesso imediato à conta. Sessões existentes serão invalidadas.",
      requireText: "BLOQUEAR",
    },
    unblock: {
      title: "Desbloquear usuário",
      impact: "O usuário poderá fazer login e usar a plataforma normalmente.",
    },
    "reset-limit": {
      title: "Resetar limite mensal",
      impact:
        "Zera os contadores de uso do período atual. O usuário poderá usar ferramentas como se fosse o início do ciclo.",
    },
  };

  const cfg = dialogMode ? dialogConfig[dialogMode] : null;

  return (
    <>
      <Card>
        <CardTitle className="mb-4">Ações administrativas</CardTitle>

        {/* Credits section */}
        <section aria-labelledby="credits-actions-heading" className="mb-5">
          <h3 id="credits-actions-heading" className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Créditos
          </h3>
          <p className="mb-3 text-xs text-muted">
            Saldo atual:{" "}
            <strong className="text-brand-500">{currentCredits.toLocaleString("pt-BR")}</strong>
          </p>
          <Input
            label="Quantidade"
            type="number"
            min="1"
            value={creditAmount}
            onChange={(e) => setCreditAmount(e.target.value)}
            hint="Informe a quantidade antes de confirmar."
            aria-label="Quantidade de créditos"
          />
          <div className="mt-3 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<PlusCircle className="h-4 w-4" aria-hidden />}
              onClick={() => setDialogMode("grant-credits")}
              disabled={loading}
              className="flex-1"
              aria-label="Conceder créditos"
            >
              Conceder
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<MinusCircle className="h-4 w-4" aria-hidden />}
              onClick={() => setDialogMode("revoke-credits")}
              disabled={loading}
              className="flex-1"
              aria-label="Remover créditos"
            >
              Remover
            </Button>
          </div>
        </section>

        {/* Account actions */}
        <section aria-labelledby="account-actions-heading" className="space-y-2">
          <h3 id="account-actions-heading" className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Conta
          </h3>

          {isBanned ? (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ShieldCheck className="h-4 w-4" aria-hidden />}
              onClick={() => setDialogMode("unblock")}
              disabled={loading}
              className="w-full justify-start"
              aria-label="Desbloquear usuário"
            >
              Desbloquear usuário
            </Button>
          ) : (
            <Button
              variant="danger"
              size="sm"
              leftIcon={<ShieldAlert className="h-4 w-4" aria-hidden />}
              onClick={() => setDialogMode("block")}
              disabled={loading}
              className="w-full justify-start"
              aria-label="Bloquear usuário"
            >
              Bloquear usuário
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" aria-hidden />}
            onClick={() => setDialogMode("reset-limit")}
            disabled={loading}
            className="w-full justify-start"
            aria-label="Resetar limite mensal"
          >
            Resetar limite mensal
          </Button>
        </section>
      </Card>

      {cfg && dialogMode && (
        <ConfirmDialog
          open={!!dialogMode}
          title={cfg.title}
          impact={cfg.impact}
          requireText={cfg.requireText}
          reasonRequired
          onConfirm={onConfirm}
          onClose={() => setDialogMode(null)}
        />
      )}
    </>
  );
}
