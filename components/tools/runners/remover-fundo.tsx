"use client";

import { UploadZone } from "@/components/ui/UploadZone";
import { ResultPanel } from "@/components/ui/ResultPanel";
import { UsageMeter } from "@/components/ui/UsageMeter";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { useToolRun } from "@/hooks/useToolRun";
import { getTool } from "@/lib/tools/registry";
import { ToolError, type ProcessResult } from "@/lib/tools/process-types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOOL_SLUG = "remover-fundo";
const tool = getTool(TOOL_SLUG)!;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Derive output filename: <stem>-sem-fundo.png */
function buildOutputName(originalName: string): string {
  const dot = originalName.lastIndexOf(".");
  const stem = dot > 0 ? originalName.slice(0, dot) : originalName;
  return `${stem}-sem-fundo.png`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RemoverFundoRunner() {
  const { state, result, progress, setProgress, error, run, reset } =
    useToolRun(TOOL_SLUG);

  const handleFiles = (files: File[]) => {
    run(async (): Promise<ProcessResult> => {
      // Validate — UploadZone already checks, but defend at the handler too
      const file = files[0];
      if (!file) throw new ToolError("TOOL_FILE_TYPE_INVALID");

      if (!tool.accept.includes(file.type)) {
        throw new ToolError("TOOL_FILE_TYPE_INVALID");
      }
      if (file.size > tool.maxSizeMB * 1024 * 1024) {
        throw new ToolError("TOOL_FILE_TOO_LARGE");
      }

      // Dynamic import — keeps the heavy WASM/ML model out of the initial bundle
      setProgress(5);
      const { removeBackground } = await import("@imgly/background-removal");
      setProgress(15);

      // Run the model; the library fires a progress callback with a float 0–1
      const resultBlob: Blob = await removeBackground(file, {
        progress: (key: string, current: number, total: number) => {
          // key examples: "compute:inference", "fetch:*"
          if (total > 0) {
            // Map model progress into 15–95% range
            const pct = 15 + Math.round((current / total) * 80);
            setProgress(Math.min(pct, 95));
          }
        },
      });

      setProgress(100);

      const outputName = buildOutputName(file.name);
      const summary = `Fundo removido com sucesso — arquivo salvo como "${outputName}"`;

      return {
        files: [{ name: outputName, blob: resultBlob }],
        summary,
      };
    });
  };

  // ---- Success ----
  if (state === "success" && result) {
    return (
      <div className="space-y-6">
        <ResultPanel result={result} toolSlug={TOOL_SLUG} onReset={reset} />
        <UsageMeter used={0} limit={tool.limits.anonPerDay} />
      </div>
    );
  }

  // ---- Processing ----
  if (state === "processing") {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Removendo fundo da imagem"
        className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-surface px-6 py-16 text-center"
      >
        <Spinner className="h-8 w-8" aria-hidden="true" />
        <p className="font-medium text-fg">
          {progress < 15
            ? "Carregando modelo de IA…"
            : progress < 95
              ? `Removendo fundo… (${progress}%)`
              : "Finalizando…"}
        </p>
        <p className="text-sm text-muted">
          Tudo roda no seu aparelho — nenhuma imagem é enviada para nossos
          servidores. Pode levar alguns segundos na primeira vez.
        </p>
      </div>
    );
  }

  // ---- Idle / Error ----
  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div
        role="note"
        className="rounded-lg border border-brand-500/30 bg-brand-50/60 px-4 py-3 text-sm text-fg dark:bg-brand-900/20"
      >
        <span className="font-semibold">Processado no seu dispositivo.</span>{" "}
        O modelo de IA roda completamente no navegador — suas imagens nunca saem
        do aparelho. Na primeira execução, o modelo é baixado (~40 MB) e fica em
        cache para as próximas vezes.
      </div>

      {/* Credit cost notice */}
      <p className="text-xs text-muted">
        Custo: <span className="font-medium text-fg">1 crédito</span> por
        imagem.
      </p>

      {/* Upload zone — accepts one image at a time */}
      <UploadZone
        accept={tool.accept}
        maxSizeMB={tool.maxSizeMB}
        multiple={false}
        toolSlug={TOOL_SLUG}
        onFiles={handleFiles}
      />

      {/* Error message */}
      {state === "error" && error && (
        <div
          role="alert"
          className="rounded-lg border border-danger-500/30 bg-danger-100/40 px-4 py-3 text-sm text-danger-700"
        >
          {error}{" "}
          <Button variant="link" size="sm" onClick={reset} className="underline">
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Usage meter */}
      <UsageMeter used={0} limit={tool.limits.anonPerDay} />
    </div>
  );
}
