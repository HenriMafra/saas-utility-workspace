"use client";

import { useState } from "react";
import { toast } from "sonner";
import { LogOut, Monitor } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function ActiveSessions() {
  const [loading, setLoading] = useState(false);
  const [revoked, setRevoked] = useState(false);

  async function handleRevokeOthers() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut({ scope: "others" });
      if (error) throw error;
      setRevoked(true);
      toast.success("Todas as outras sessões foram encerradas.");
    } catch {
      toast.error("Não conseguimos encerrar as sessões. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardTitle>Sessões ativas</CardTitle>
      <CardDescription className="mt-1 mb-5">
        Encerre o acesso em todos os outros dispositivos onde você está conectado(a).
        Esta sessão atual permanecerá ativa.
      </CardDescription>

      <div className="flex items-start gap-4 rounded-lg border border-border bg-bg p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface">
          <Monitor className="h-5 w-5 text-muted" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-fg">Este dispositivo</p>
          <p className="text-sm text-muted">Sessão atual — ativa agora</p>
        </div>
        <span className="rounded-full bg-success-500/10 px-2.5 py-0.5 text-xs font-medium text-success-700 dark:text-success-500">
          Ativa
        </span>
      </div>

      {revoked && (
        <p
          role="status"
          className="mt-4 rounded-lg bg-success-500/10 px-4 py-3 text-sm text-success-700 dark:text-success-500"
        >
          Outras sessões encerradas com sucesso.
        </p>
      )}

      <div className="mt-5 flex justify-end">
        <Button
          variant="danger"
          size="md"
          loading={loading}
          disabled={revoked}
          leftIcon={<LogOut className="h-4 w-4" aria-hidden />}
          onClick={handleRevokeOthers}
          aria-label="Encerrar todas as outras sessões"
        >
          Encerrar todas as outras sessões
        </Button>
      </div>
    </Card>
  );
}
