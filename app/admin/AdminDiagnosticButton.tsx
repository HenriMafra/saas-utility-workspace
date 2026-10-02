"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface AdminDiagnosticButtonProps {
  label: string;
  icon: LucideIcon;
  endpoint: string;
  successMessage: string;
  /** Se definido, exibe ConfirmDialog antes de chamar o endpoint. */
  confirmImpact?: string;
}

export function AdminDiagnosticButton({
  label,
  icon: Icon,
  endpoint,
  successMessage,
  confirmImpact,
}: AdminDiagnosticButtonProps) {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function execute() {
    setLoading(true);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body?.error ?? "Erro ao executar ação.");
      } else {
        toast.success(successMessage);
      }
    } catch {
      toast.error("Falha de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleClick() {
    if (confirmImpact) {
      setConfirmOpen(true);
    } else {
      execute();
    }
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        loading={loading}
        leftIcon={<Icon className="h-4 w-4" aria-hidden />}
        onClick={handleClick}
        aria-label={label}
      >
        {label}
      </Button>

      {confirmImpact && (
        <ConfirmDialog
          open={confirmOpen}
          title={label}
          impact={confirmImpact}
          requireText="CONFIRMAR"
          reasonRequired
          onConfirm={async () => {
            setConfirmOpen(false);
            await execute();
          }}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}
