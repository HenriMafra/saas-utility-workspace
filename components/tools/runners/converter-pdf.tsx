"use client";

import { useCallback, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ImageIcon, FileText, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { UploadZone } from "@/components/ui/UploadZone";
import { ResultPanel } from "@/components/ui/ResultPanel";
import { UsageMeter } from "@/components/ui/UsageMeter";
import { useToolRun } from "@/hooks/useToolRun";
import { getTool } from "@/lib/tools/registry";
import { ToolError } from "@/lib/tools/process-types";
import { cn, formatBytes } from "@/lib/utils";

const TOOL_SLUG = "converter-pdf";
const tool = getTool(TOOL_SLUG)!;

/** Accepted MIME types for the image→PDF direction */
const IMAGE_ACCEPT = ["image/jpeg", "image/png"];

type Direction = "img-to-pdf" | "pdf-to-img";

interface ImageEntry {
  id: string;
  file: File;
  /** Object URL for preview — revoked on reset */
  previewUrl: string;
}

let idCounter = 0;
function nextId(): string {
  return String(++idCounter);
}

/** Read a File as ArrayBuffer, throwing ToolError on failure. */
async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () =>
      reject(new ToolError("TOOL_FILE_CORRUPT", `Não foi possível ler "${file.name}".`));
    reader.readAsArrayBuffer(file);
  });
}

export default function Runner() {
  const { state, result, error, run, reset } = useToolRun(TOOL_SLUG);
  const [direction, setDirection] = useState<Direction>("img-to-pdf");
  const [entries, setEntries] = useState<ImageEntry[]>([]);

  /* ------------------------------------------------------------------ */
  /* File handling                                                        */
  /* ------------------------------------------------------------------ */

  const handleFiles = useCallback((files: File[]) => {
    if (direction !== "img-to-pdf") return;

    setEntries((prev) => {
      const next = [...prev];
      for (const f of files) {
        const alreadyIn = next.some(
          (e) => e.file.name === f.name && e.file.size === f.size,
        );
        if (!alreadyIn) {
          next.push({
            id: nextId(),
            file: f,
            previewUrl: URL.createObjectURL(f),
          });
        }
      }
      return next;
    });
  }, [direction]);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const entry = prev.find((e) => e.id === id);
      if (entry) URL.revokeObjectURL(entry.previewUrl);
      return prev.filter((e) => e.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setEntries((prev) => {
      prev.forEach((e) => URL.revokeObjectURL(e.previewUrl));
      return [];
    });
  }, []);

  const handleReset = useCallback(() => {
    clearAll();
    reset();
  }, [clearAll, reset]);

  /* ------------------------------------------------------------------ */
  /* Direction toggle                                                     */
  /* ------------------------------------------------------------------ */

  const handleDirectionChange = useCallback((dir: Direction) => {
    setDirection(dir);
    clearAll();
    reset();
  }, [clearAll, reset]);

  /* ------------------------------------------------------------------ */
  /* Conversion — image → PDF                                            */
  /* ------------------------------------------------------------------ */

  const handleConvert = useCallback(() => {
    if (entries.length === 0) return;

    run(async () => {
      // Validate each file
      for (const entry of entries) {
        if (!IMAGE_ACCEPT.includes(entry.file.type)) {
          throw new ToolError(
            "TOOL_FILE_TYPE_INVALID",
            `"${entry.file.name}" não é uma imagem JPG ou PNG válida.`,
          );
        }
        if (entry.file.size > tool.maxSizeMB * 1024 * 1024) {
          throw new ToolError(
            "TOOL_FILE_TOO_LARGE",
            `"${entry.file.name}" excede o limite de ${tool.maxSizeMB} MB.`,
          );
        }
      }

      let pdfDoc: PDFDocument;
      try {
        pdfDoc = await PDFDocument.create();
      } catch {
        throw new ToolError("TOOL_PROCESSING_FAILED", "Falha ao criar documento PDF.");
      }

      for (const entry of entries) {
        const arrayBuffer = await readFileAsArrayBuffer(entry.file);
        const bytes = new Uint8Array(arrayBuffer);

        let page;
        try {
          if (entry.file.type === "image/jpeg") {
            const jpgImage = await pdfDoc.embedJpg(bytes);
            const { width, height } = jpgImage.scale(1);
            page = pdfDoc.addPage([width, height]);
            page.drawImage(jpgImage, { x: 0, y: 0, width, height });
          } else {
            // image/png
            const pngImage = await pdfDoc.embedPng(bytes);
            const { width, height } = pngImage.scale(1);
            page = pdfDoc.addPage([width, height]);
            page.drawImage(pngImage, { x: 0, y: 0, width, height });
          }
        } catch {
          throw new ToolError(
            "TOOL_FILE_CORRUPT",
            `Não foi possível incorporar "${entry.file.name}" ao PDF. Verifique se o arquivo não está corrompido.`,
          );
        }
      }

      let pdfBytes: Uint8Array;
      try {
        pdfBytes = await pdfDoc.save();
      } catch {
        throw new ToolError("TOOL_PROCESSING_FAILED", "Falha ao salvar o PDF gerado.");
      }

      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const n = entries.length;
      const totalPages = pdfDoc.getPageCount();
      const totalInputSize = entries.reduce((acc, e) => acc + e.file.size, 0);

      return {
        files: [{ name: "imagens-convertidas.pdf", blob }],
        summary: `${n} imagem${n !== 1 ? "ns" : ""} convertida${n !== 1 ? "s" : ""} em PDF (${totalPages} página${totalPages !== 1 ? "s" : ""}, entrada total: ${formatBytes(totalInputSize)}).`,
      };
    });
  }, [entries, run]);

  /* ------------------------------------------------------------------ */
  /* Render — success                                                     */
  /* ------------------------------------------------------------------ */

  if (state === "success" && result) {
    return (
      <div className="space-y-4">
        <ResultPanel result={result} toolSlug={TOOL_SLUG} onReset={handleReset} />
        <UsageMeter used={0} limit={tool.limits.anonPerDay} />
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Render — processing                                                  */
  /* ------------------------------------------------------------------ */

  if (state === "processing") {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-surface py-16"
        role="status"
        aria-label="Convertendo imagens para PDF…"
      >
        <Spinner className="h-10 w-10 text-brand-500" />
        <p className="text-sm font-medium text-muted">Convertendo imagens para PDF…</p>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Render — idle / error                                                */
  /* ------------------------------------------------------------------ */

  return (
    <div className="space-y-6">

      {/* Direction selector */}
      <fieldset aria-label="Direção de conversão">
        <legend className="sr-only">Escolha a direção da conversão</legend>
        <div
          className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface p-1"
          role="radiogroup"
          aria-label="Direção de conversão"
        >
          {/* Image → PDF */}
          <label
            className={cn(
              "flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors select-none",
              direction === "img-to-pdf"
                ? "bg-brand-500 text-white shadow-sm"
                : "text-muted hover:text-fg",
            )}
          >
            <input
              type="radio"
              name="converter-direction"
              value="img-to-pdf"
              checked={direction === "img-to-pdf"}
              onChange={() => handleDirectionChange("img-to-pdf")}
              className="sr-only"
            />
            <ImageIcon className="h-4 w-4 shrink-0" aria-hidden />
            <span>Imagem → PDF</span>
          </label>

          {/* PDF → Image (disabled) */}
          <label
            className={cn(
              "flex cursor-not-allowed items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium select-none",
              "text-muted opacity-50",
            )}
            title="Disponível em breve — requer processamento no servidor"
          >
            <input
              type="radio"
              name="converter-direction"
              value="pdf-to-img"
              disabled
              className="sr-only"
              aria-disabled="true"
            />
            <FileText className="h-4 w-4 shrink-0" aria-hidden />
            <span>PDF → Imagem</span>
          </label>
        </div>
      </fieldset>

      {/* Notice for disabled direction */}
      {direction === "img-to-pdf" && (
        <p
          className="flex items-start gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-xs text-muted"
          aria-live="polite"
        >
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          A conversão PDF → Imagem estará disponível em breve e exigirá processamento no servidor.
          Por enquanto, converta suas imagens JPG e PNG em PDF gratuitamente no seu próprio navegador.
        </p>
      )}

      {/* Upload zone */}
      <section aria-label="Adicionar imagens JPG ou PNG">
        <UploadZone
          accept={IMAGE_ACCEPT}
          maxSizeMB={tool.maxSizeMB}
          multiple
          toolSlug={TOOL_SLUG}
          onFiles={handleFiles}
        />
      </section>

      {/* Image list with previews */}
      {entries.length > 0 && (
        <section aria-label="Imagens selecionadas" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-fg">
              {entries.length} imagem{entries.length !== 1 ? "ns" : ""} selecionada{entries.length !== 1 ? "s" : ""}
            </h2>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-muted transition-colors hover:text-danger-500 focus-visible:underline"
              aria-label="Remover todas as imagens"
            >
              Remover todas
            </button>
          </div>

          <ol
            className="divide-y divide-border rounded-xl border border-border bg-surface"
            aria-label="Lista de imagens a converter, uma página cada"
          >
            {entries.map((entry, index) => (
              <li
                key={entry.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  "first:rounded-t-xl last:rounded-b-xl",
                )}
              >
                {/* Page order badge */}
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white"
                  aria-label={`Página ${index + 1}`}
                >
                  {index + 1}
                </span>

                {/* Thumbnail */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entry.previewUrl}
                  alt={`Miniatura de ${entry.file.name}`}
                  className="h-10 w-10 shrink-0 rounded object-cover border border-border"
                  loading="lazy"
                />

                {/* File info */}
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-medium text-fg"
                    title={entry.file.name}
                  >
                    {entry.file.name}
                  </p>
                  <p className="text-xs text-muted">
                    {entry.file.type === "image/jpeg" ? "JPEG" : "PNG"} &middot;{" "}
                    {formatBytes(entry.file.size)}
                  </p>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  aria-label={`Remover "${entry.file.name}"`}
                  className="shrink-0 rounded p-1 text-muted transition-colors hover:bg-danger-100 hover:text-danger-500 dark:hover:bg-danger-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ol>

          <p className="text-xs text-muted">
            Cada imagem será uma página no PDF, na ordem listada acima.
          </p>
        </section>
      )}

      {/* Error message */}
      {state === "error" && error && (
        <p
          role="alert"
          className="rounded-lg border border-danger-500/30 bg-danger-100/40 px-4 py-3 text-sm text-danger-700 dark:bg-danger-900/20 dark:text-danger-400"
        >
          {error}
        </p>
      )}

      {/* Action row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          onClick={handleConvert}
          disabled={entries.length === 0}
          loading={false}
          size="lg"
          aria-disabled={entries.length === 0}
          aria-label={
            entries.length === 0
              ? "Adicione pelo menos uma imagem para converter"
              : `Converter ${entries.length} imagem${entries.length !== 1 ? "ns" : ""} para PDF`
          }
        >
          {entries.length > 0
            ? `Converter ${entries.length} imagem${entries.length !== 1 ? "ns" : ""} para PDF`
            : "Converter para PDF"}
        </Button>

        {entries.length === 0 && (
          <p className="text-xs text-muted">
            Selecione pelo menos uma imagem JPG ou PNG para continuar.
          </p>
        )}
      </div>

      {/* Usage meter */}
      <UsageMeter used={0} limit={tool.limits.anonPerDay} />
    </div>
  );
}
