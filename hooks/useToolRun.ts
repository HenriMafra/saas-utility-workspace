"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { track } from "@/lib/analytics/track";
import { ERROR_CODES } from "@/lib/errors/codes";
import { ToolError, type ProcessResult } from "@/lib/tools/process-types";

type RunState = "idle" | "processing" | "success" | "error";

/**
 * Generic client-side tool run orchestration.
 * Pass an async function that returns a ProcessResult. Handles state, errors,
 * analytics and object-URL lifecycle. UI components only render this state.
 */
export function useToolRun(toolSlug: string) {
  const [state, setState] = useState<RunState>("idle");
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (fn: () => Promise<ProcessResult>) => {
      const startedAt = performance.now();
      setState("processing");
      setError(null);
      setResult(null);
      setProgress(0);
      track("processing_started", { tool: toolSlug });
      try {
        const res = await fn();
        setResult(res);
        setState("success");
        track("processing_completed", {
          tool: toolSlug,
          duration_ms: Math.round(performance.now() - startedAt),
        });
      } catch (e) {
        const code = e instanceof ToolError ? e.code : "TOOL_PROCESSING_FAILED";
        const msg = ERROR_CODES[code as keyof typeof ERROR_CODES]?.user ?? ERROR_CODES.UNKNOWN.user;
        setError(msg);
        setState("error");
        toast.error(msg);
        track("processing_failed", { tool: toolSlug, code });
      }
    },
    [toolSlug],
  );

  const reset = useCallback(() => {
    setState("idle");
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  return { state, result, progress, setProgress, error, run, reset };
}
