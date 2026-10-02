"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ResendWebhookButtonProps {
  webhookEventId: string;
}

export function ResendWebhookButton({ webhookEventId }: ResendWebhookButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pagamentos/resend-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookEventId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error ?? "Erro ao reenviar webhook.");
        return;
      }

      toast.success("Webhook marcado para reprocessamento.");
      router.refresh();
    } catch {
      toast.error("Falha de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      loading={loading}
      leftIcon={<RefreshCw className="h-3.5 w-3.5" aria-hidden />}
      onClick={handleResend}
      aria-label={`Reenviar webhook ${webhookEventId}`}
    >
      Reenviar
    </Button>
  );
}
