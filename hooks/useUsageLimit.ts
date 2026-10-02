"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAnonId } from "@/lib/utils";
import { TOOLS_BY_SLUG } from "@/lib/tools/registry";

interface UsageLimitState {
  used: number;
  limit: number;
  blocked: boolean;
  loading: boolean;
}

/**
 * Lê a contagem de uso do dia para uma ferramenta específica.
 * Usa o user_id se autenticado, senão o anon_id.
 * Retorna { used, limit, blocked, loading }.
 */
export function useUsageLimit(toolSlug: string): UsageLimitState {
  const [state, setState] = useState<UsageLimitState>({
    used: 0,
    limit: 999,
    blocked: false,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const tool = TOOLS_BY_SLUG[toolSlug];
      if (!tool) {
        setState({ used: 0, limit: 999, blocked: false, loading: false });
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const subject = user?.id ?? getAnonId();
      if (!subject) {
        setState({ used: 0, limit: tool.limits.anonPerDay, blocked: false, loading: false });
        return;
      }

      const isAnon = !user;
      const dailyLimit = isAnon ? tool.limits.anonPerDay : tool.limits.freePerDay;
      const periodKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

      try {
        const { data, error } = await supabase
          .from("usage_counters")
          .select("count")
          .eq("subject", subject)
          .eq("tool_slug", toolSlug)
          .eq("window", "day")
          .eq("period_key", periodKey)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          console.error("[useUsageLimit] query error:", error.message);
          setState({ used: 0, limit: dailyLimit, blocked: false, loading: false });
          return;
        }

        const used = data?.count ?? 0;
        setState({
          used,
          limit: dailyLimit,
          blocked: used >= dailyLimit,
          loading: false,
        });
      } catch (err) {
        if (!cancelled) {
          console.error("[useUsageLimit] unexpected error:", err);
          setState({ used: 0, limit: dailyLimit, blocked: false, loading: false });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [toolSlug]);

  return state;
}
