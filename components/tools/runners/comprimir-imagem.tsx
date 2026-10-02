"use client";

import { useState, useId } from "react";
import { UploadZone } from "@/components/ui/UploadZone";
import { ResultPanel } from "@/components/ui/ResultPanel";
import { UsageMeter } from "@/components/ui/UsageMeter";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { useToolRun } from "@/hooks/useToolRun";
import { getTool } from "@/lib/tools/registry";
import { ToolError, type ProcessResult } from "@/lib/tools/process-types";
import { formatBytes, reductionPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type QualityPreset = "alta" | "media" | "baixa";

interface QualityOption {
  label: string;
  description: string;
  quality: number; // 0–1, used for lossy formats
  maxDimensionPx: number; // max width/height before downscaling
}

const QUALITY_OPTIONS: Record<QualityPreset, QualityOption> = {
  alta: {
    label: "Alta qualidade",
    description: "Redução leve (~30%). Ideal para impressão.",
    quality: 0.85,
    maxDimensionPx: 4000,
  },
  media: {
    label: "Equilíbrio",
    description: "Redução moderada (~55%). Ótimo para web e e-mail.",
    quality: 0.7,
    maxDimensionPx: 2400,
  },
  baixa: {
    label: "Máxima compressão",
    description: "Redução máxima (~75%). Ideal para WhatsApp e redes sociais.",
    quality: 0.45,
    maxDimensionPx: 1600,
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Derive output MIME type and extension from original file. */
function getMimeAndExt(file: File): { mime: string; ext: string } {
  if (file.type === "image/png") return { mime: "image/png", ext: "png" };
  if (file.type === "image/webp") return { mime: "image/webp", ext: "webp" };
  // default: jpeg (also catches image/jpg)
  return { mime: "image/jpeg", ext: "jpg" };
}

/** Build output filename: <stem>-comprimida.<ext> */
function buildOutputName(originalName: string, ext: string): string {
  const dot = originalName.lastIndexOf(".");
  const stem = dot > 0 ? originalName.slice(0, dot) : originalName;
  return `${stem}-comprimida.${ext}`;
}

/**
 * Compress a single image File using the Canvas API.
 * Returns a Blob of the compressed image.
 */
async function compressImage(
  file: File,
  preset: QualityOption,
): Promise<{ blob: Blob; originalSize: number; compressedSize: number }> {
  const { mime, ext: _ext } = getMimeAndExt(file);
  const originalSize = file.size;

  // Decode the image into a bitmap
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new ToolError("TOOL_FILE_CORRUPT");
  });

  const { width: origW, height: origH } = bitmap;
  const max = preset.maxDimensionPx;

  // Calculate downscale ratio preserving aspect ratio
  let targetW = origW;
  let targetH = origH;
  if (origW > max || origH > max) {
    const ratio = Math.min(max / origW, max / origH);
    targetW = Math.round(origW * ratio);
    targetH = Math.round(origH * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ToolError("TOOL_PROCESSING_FAILED", "Canvas context unavailable");

  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  // PNG is lossless — use quality for JPEG/WebP only
  const qualityArg = mime === "image/png" ? undefined : preset.quality;

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, qualityArg),
  );

  if (!blob) throw new ToolError("TOOL_PROCESSING_FAILED", "toBlob returned null");

  const compressedSize = blob.size;
  return { blob, originalSize, compressedSize };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TOOL_SLUG = "comprimir-imagem";
const tool = getTool(TOOL_SLUG)!;

export default function ComprimirImagemRunner() {
  const { state, result, progress, setProgress, error, run, reset } = useToolRun(TOOL_SLUG);
  const [preset, setPreset] = useState<QualityPreset>("media");
  const presetId = useId();

  const handleFiles = (files: File[]) => {
    run(async (): Promise<ProcessResult> => {
      // Validate types upfront (UploadZone already checks, but double-check)
      for (const f of files) {
        if (!tool.accept.includes(f.type)) {
          throw new ToolError("TOOL_FILE_TYPE_INVALID");
        }
        if (f.size > tool.maxSizeMB * 1024 * 1024) {
          throw new ToolError("TOOL_FILE_TOO_LARGE");
        }
      }

      const option = QUALITY_OPTIONS[preset];
      const outputFiles: { name: string; blob: Blob }[] = [];
      let totalBefore = 0;
      let totalAfter = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(Math.round(((i + 0.1) / files.length) * 100));

        const { mime: _mime, ext } = getMimeAndExt(file);
        const { blob, originalSize, compressedSize } = await compressImage(file, option);

        totalBefore += originalSize;
        totalAfter += compressedSize;

        outputFiles.push({
          name: buildOutputName(file.name, ext),
          blob,
        });

        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      const reduction = reductionPercent(totalBefore, totalAfter);
      const summary =
        files.length === 1
          ? `Imagem comprimida em ${reduction}% — ${formatBytes(totalBefore)} → ${formatBytes(totalAfter)}`
          : `${files.length} imagens comprimidas em média ${reduction}% — ${formatBytes(totalBefore)} → ${formatBytes(totalAfter)}`;

      return { files: outputFiles, summary };
    });
  };

  // ----- Render: success -----
  if (state === "success" && result) {
    return (
      <div className="space-y-6">
        <ResultPanel
          result={result}
          toolSlug={TOOL_SLUG}
          onReset={reset}
        />
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
        aria-label="Comprimindo imagem"
        className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-surface px-6 py-16 text-center"
      >
        <Spinner className="h-8 w-8" />
        <p className="font-medium text-fg">Comprimindo{progress > 0 ? ` (${progress}%)` : "…"}</p>
        <p className="text-sm text-muted">Processado no seu navegador — nenhum dado é enviado.</p>
      </div>
    );
  }

  // ----- Render: idle / error -----
  return (
    <div className="space-y-6">
      {/* Quality preset selector */}
      <fieldset>
        <legend
          id={`${presetId}-legend`}
          className="mb-3 text-sm font-medium text-fg"
        >
          Qualidade de saída
        </legend>
        <div role="radiogroup" aria-labelledby={`${presetId}-legend`} className="grid gap-2 sm:grid-cols-3">
          {(Object.entries(QUALITY_OPTIONS) as [QualityPreset, QualityOption][]).map(
            ([key, opt]) => {
              const selected = preset === key;
              return (
                <label
                  key={key}
                  className={cn(
                    "flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition-colors",
                    selected
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                      : "border-border bg-surface hover:border-brand-400",
                  )}
                >
                  <input
                    type="radio"
                    name={`${presetId}-preset`}
                    value={key}
                    checked={selected}
                    onChange={() => setPreset(key)}
                    className="sr-only"
                    aria-label={opt.label}
                  />
                  <span className={cn("text-sm font-semibold", selected ? "text-brand-600" : "text-fg")}>
                    {opt.label}
                  </span>
                  <span className="text-xs text-muted">{opt.description}</span>
                </label>
              );
            },
          )}
        </div>
      </fieldset>

      {/* Upload zone */}
      <UploadZone
        accept={tool.accept}
        maxSizeMB={tool.maxSizeMB}
        multiple
        toolSlug={TOOL_SLUG}
        onFiles={handleFiles}
      />

      {/* Error message */}
      {state === "error" && error && (
        <div role="alert" className="rounded-lg border border-danger-500/30 bg-danger-100/40 px-4 py-3 text-sm text-danger-700">
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
        Tudo processado no seu navegador — suas imagens nunca saem do dispositivo.
      </p>
    </div>
  );
}
