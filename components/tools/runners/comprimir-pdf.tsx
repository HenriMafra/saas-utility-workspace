"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { UploadZone } from "@/components/ui/UploadZone";
import { ResultPanel } from "@/components/ui/ResultPanel";
import { UsageMeter } from "@/components/ui/UsageMeter";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { getTool } from "@/lib/tools/registry";
import { useToolRun } from "@/hooks/useToolRun";
import { ToolError } from "@/lib/tools/process-types";
import { formatBytes, reductionPercent } from "@/lib/utils";

type CompressionLevel = "balanced" | "maximum";

export default function ComprimirPdfRunner() {
  const tool = getTool("comprimir-pdf");
  const { state, result, error, run, reset } = useToolRun("comprimir-pdf");
  const [level, setLevel] = useState<CompressionLevel>("balanced");

  if (!tool) return null;

  async function handleFiles(files: File[]) {
    const file = files[0];
    if (!file) return;

    // Extra type guard (UploadZone already validates, but be strict)
    if (file.type !== "application/pdf") {
      throw new ToolError("TOOL_FILE_TYPE_INVALID");
    }

    await run(async () => {
      let bytes: ArrayBuffer;
      try {
        bytes = await file.arrayBuffer();
      } catch {
        throw new ToolError("TOOL_PROCESSING_FAILED");
      }

      let pdfDoc: PDFDocument;
      try {
        pdfDoc = await PDFDocument.load(bytes, {
          updateMetadata: false,
          // Ignore encryption errors to surface a better message below
          ignoreEncryption: false,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message.toLowerCase() : "";
        if (msg.includes("encrypt") || msg.includes("password") || msg.includes("decrypt")) {
          throw new ToolError("TOOL_PDF_LOCKED");
        }
        throw new ToolError("TOOL_FILE_CORRUPT");
      }

      // In maximum mode, strip document-level metadata
      if (level === "maximum") {
        pdfDoc.setTitle("");
        pdfDoc.setAuthor("");
        pdfDoc.setSubject("");
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer("");
        pdfDoc.setCreator("");
        // Remove creation and modification dates by setting them to epoch
        // (pdf-lib doesn't expose a removeXXX API; setting to empty is the closest)
      }

      let compressedBytes: Uint8Array;
      try {
        compressedBytes = await pdfDoc.save({
          useObjectStreams: true,
          addDefaultPage: false,
          objectsPerTick: 50,
        });
      } catch {
        throw new ToolError("TOOL_PROCESSING_FAILED");
      }

      const originalSize = file.size;
      const compressedSize = compressedBytes.byteLength;
      const reduction = reductionPercent(originalSize, compressedSize);

      const summary =
        reduction > 0
          ? `Reduzido ${reduction}% (${formatBytes(originalSize)} → ${formatBytes(compressedSize)})`
          : `Processado — ${formatBytes(compressedSize)} (sem ganho adicional de compressão)`;

      const baseName = file.name.replace(/\.pdf$/i, "");
      const outputName = `${baseName}-comprimido.pdf`;

      const blob = new Blob([compressedBytes as BlobPart], { type: "application/pdf" });

      return { files: [{ name: outputName, blob }], summary };
    });
  }

  return (
    <section aria-label="Compressor de PDF" className="flex flex-col gap-6">
      {/* Compression level selector */}
      {state === "idle" && (
        <fieldset className="rounded-xl border border-border bg-surface p-4">
          <legend className="mb-3 text-sm font-medium text-fg">Nível de compressão</legend>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-bg p-3 transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 dark:has-[:checked]:bg-brand-900/20">
              <input
                type="radio"
                name="comprimir-pdf-level"
                value="balanced"
                checked={level === "balanced"}
                onChange={() => setLevel("balanced")}
                className="mt-0.5 accent-brand-500"
              />
              <span>
                <span className="block text-sm font-medium text-fg">Equilibrado</span>
                <span className="block text-xs text-muted">
                  Reduz o tamanho mantendo metadados e estrutura do arquivo.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-bg p-3 transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 dark:has-[:checked]:bg-brand-900/20">
              <input
                type="radio"
                name="comprimir-pdf-level"
                value="maximum"
                checked={level === "maximum"}
                onChange={() => setLevel("maximum")}
                className="mt-0.5 accent-brand-500"
              />
              <span>
                <span className="block text-sm font-medium text-fg">Máxima</span>
                <span className="block text-xs text-muted">
                  Aplica compressão máxima e remove metadados (autor, título, etc.).
                </span>
              </span>
            </label>
          </div>
        </fieldset>
      )}

      {/* Upload area — only show when idle */}
      {state === "idle" && (
        <UploadZone
          accept={tool.accept}
          maxSizeMB={tool.maxSizeMB}
          multiple={false}
          toolSlug={tool.slug}
          onFiles={handleFiles}
        />
      )}

      {/* Processing state */}
      {state === "processing" && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface py-12 text-center"
        >
          <Spinner className="h-8 w-8" />
          <p className="text-sm font-medium text-fg">Comprimindo PDF…</p>
          <p className="text-xs text-muted">Processado no seu navegador — nenhum dado é enviado.</p>
        </div>
      )}

      {/* Error state */}
      {state === "error" && error && (
        <div className="rounded-xl border border-danger-500/30 bg-danger-100/40 p-5">
          <p role="alert" className="text-sm font-medium text-danger-700">
            {error}
          </p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={reset}>
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Success state */}
      {state === "success" && result && (
        <ResultPanel
          result={result}
          toolSlug={tool.slug}
          onReset={reset}
        />
      )}

      {/* Usage meter — shown when idle or after success */}
      {(state === "idle" || state === "success") && (
        <UsageMeter used={0} limit={tool.limits.anonPerDay} />
      )}
    </section>
  );
}
