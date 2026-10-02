import { createAdminClient } from "@/lib/supabase/admin";

export interface RateLimitResult {
  allowed: boolean;
  count: number;
}

/**
 * Incrementa o contador de uso via RPC e retorna se o sujeito ainda está dentro do limite.
 * Usa service-role para garantir que a escrita funcione independentemente de RLS.
 */
export async function checkLimit(
  subject: string,
  toolSlug: string,
  window: string,
  limit: number,
): Promise<RateLimitResult> {
  const supabase = createAdminClient();
  const periodKey = buildPeriodKey(window);

  const { data, error } = await supabase.rpc("increment_usage", {
    p_subject: subject,
    p_tool: toolSlug,
    p_window: window,
    p_period: periodKey,
  });

  if (error) {
    // Em caso de falha, deixa passar para não bloquear usuários por erros de infra.
    console.error("[rate-limit] rpc increment_usage error:", error.message);
    return { allowed: true, count: 0 };
  }

  const count = (data as number) ?? 0;
  return { allowed: count <= limit, count };
}

/** Constrói a chave de período com base na janela solicitada. */
function buildPeriodKey(window: string): string {
  const now = new Date();
  if (window === "day") {
    return now.toISOString().slice(0, 10); // YYYY-MM-DD
  }
  if (window === "hour") {
    return now.toISOString().slice(0, 13); // YYYY-MM-DDTHH
  }
  if (window === "month") {
    return now.toISOString().slice(0, 7); // YYYY-MM
  }
  // default: day
  return now.toISOString().slice(0, 10);
}
