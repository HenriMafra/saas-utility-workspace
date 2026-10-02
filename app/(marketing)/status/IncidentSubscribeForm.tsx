"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export function IncidentSubscribeForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      // Em produção: POST /api/status/subscribe
      await new Promise((r) => setTimeout(r, 600));
      setDone(true);
      toast.success("Inscrição confirmada! Você receberá alertas por e-mail.");
    } catch {
      toast.error("Não foi possível inscrever. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm text-success-700" role="status">
        Inscrito com sucesso. Você receberá atualizações de incidentes no e-mail informado.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="status-subscribe-email" className="mb-1 block text-sm font-medium">
          E-mail
        </label>
        <input
          id="status-subscribe-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-describedby="status-subscribe-hint"
        />
        <p id="status-subscribe-hint" className="mt-1 text-xs text-muted">
          Apenas alertas de incidentes. Sem spam. Cancele a qualquer hora.
        </p>
      </div>
      <Button type="submit" loading={loading} className="sm:shrink-0">
        Assinar alertas
      </Button>
    </form>
  );
}
