"use client";

import { useCallback } from "react";
import { UploadZone } from "@/components/ui/UploadZone";
import { ResultPanel } from "@/components/ui/ResultPanel";
import { UsageMeter } from "@/components/ui/UsageMeter";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToolRun } from "@/hooks/useToolRun";
import { getTool } from "@/lib/tools/registry";
import { ToolError, type ProcessResult } from "@/lib/tools/process-types";
import { Info } from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOOL_SLUG = "ocr";
const tool = getTool(TOOL_SLUG)!;

// MIME types accepted for client-side OCR (images only — PDF is Pro/server)
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png"] as const;
type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

function isAcceptedImageType(mime: string): mime is AcceptedImageType {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(mime);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildTxtFilename(originalName: string): string {
  const dot = originalName.lastIndexOf(".");
  const stem = dot > 0 ? originalName.slice(0, dot) : originalName;
  return `${stem}-ocr.txt`;
}

// ---------------------------------------------------------------------------
// Core OCR function (runs in the browser via tesseract.js dynamic import)
// ---------------------------------------------------------------------------

async function runOcr(
  file: File,
  onProgress: (pct: number) => void,
): Promise<string> {
  // Dynamic import keeps tesseract.js out of the initial bundle
  const Tesseract = (await import("tesseract.js")).default;

  const { data } = await Tesseract.recognize(file, "por", {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  const text: string = data.text?.trim() ?? "";

  // Warn about low-confidence results (avg confidence < 40)
  const confidence: number = (data as { confidence?: number }).confidence ?? 100;
  if (confidence < 40) {
    throw new ToolError("TOOL_OCR_LOW_CONF");
  }

  return text;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OcrRunner() {
  const { state, result, progress, setProgress, error, run, reset } = useToolRun(TOOL_SLUG);

  const handleFiles = useCallback(
    (files: File[]) => {
      run(async (): Promise<ProcessResult> => {
        const file = files[0];
        if (!file) throw new ToolError("TOOL_FILE_TYPE_INVALID");

        // Reject PDFs with a friendly message (server/Pro feature)
        if (file.type === "application/pdf") {
          throw new ToolError(
            "TOOL_FILE_TYPE_INVALID",
            "OCR de PDF estará disponível no servidor (Pro)",
          );
        }

        // Type guard
        if (!isAcceptedImageType(file.type)) {
          throw new ToolError("TOOL_FILE_TYPE_INVALID");
        }

        // Size guard
        if (file.size > tool.maxSizeMB * 1024 * 1024) {
          throw new ToolError("TOOL_FILE_TOO_LARGE");
        }

        setProgress(5);

        let extractedText: string;
        try {
          extractedText = await runOcr(file, (pct) => {
            // Map tesseract progress 0–100 into 10–95 to leave room for upload/init steps
            setProgress(10 + Math.round(pct * 0.85));
          });
        } catch (err) {
          if (err instanceof ToolError) throw err;
          throw new ToolError("TOOL_PROCESSING_FAILED");
        }

        if (!extractedText) {
          throw new ToolError("TOOL_OCR_LOW_CONF");
        }

        setProgress(98);

        const txtBlob = new Blob([extractedText], { type: "text/plain;charset=utf-8" });
        const outputName = buildTxtFilename(file.name);

        const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
        const summary = `Texto extraído com sucesso — ${wordCount} palavra${wordCount !== 1 ? "s" : ""} encontrada${wordCount !== 1 ? "s" : ""}.`;

        setProgress(100);

        return {
          files: [{ name: outputName, blob: txtBlob }],
          summary,
          text: extractedText,
        };
      });
    },
    [run, setProgress],
  );

  // ----- Render: success -----
  if (state === "success" && result) {
    return (
      <div className="space-y-6">
        <ResultPanel result={result} toolSlug={TOOL_SLUG} onReset={reset} />
        <UsageMeter used={0} limit={tool.limits.anonPerDay} />
      </div>
    );
  }

  // ----- Render: processing -----
  if (state === "processing") {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Extraindo texto da imagem"
        className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-surface px-6 py-16 text-center"
      >
        <Spinner className="h-8 w-8" aria-hidden />
        <p className="font-medium text-fg">
          {progress > 0 ? `Reconhecendo texto… ${progress}%` : "Iniciando OCR…"}
        </p>
        <p className="text-sm text-muted">
          Processado no seu navegador — nenhuma imagem é enviada.
        </p>
        {progress > 0 && (
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progresso: ${progress}%`}
            className="h-1.5 w-48 overflow-hidden rounded-full bg-border"
          >
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  // ----- Render: idle / error -----
  return (
    <div className="space-y-6">
      {/* PDF notice */}
      <div
        role="note"
        aria-label="Aviso sobre PDFs"
        className="flex items-start gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden />
        <span>
          OCR de imagens <strong className="text-fg">JPG e PNG</strong> roda no navegador, grátis.{" "}
          <Badge variant="brand">Em breve</Badge>{" "}
          OCR de PDF estará disponível no modo servidor (plano Pro).
        </span>
      </div>

      {/* Upload zone — only images for now */}
      <UploadZone
        accept={[...ACCEPTED_IMAGE_TYPES]}
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

      {/* Privacy note */}
      <p className="text-center text-xs text-muted">
        Todo o processamento acontece no seu navegador — suas imagens nunca saem do dispositivo.
      </p>
    </div>
  );
}
