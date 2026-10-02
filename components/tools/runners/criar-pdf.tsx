"use client";

import { useCallback, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { GripVertical, Trash2, MoveUp, MoveDown } from "lucide-react";

import { useToolRun } from "@/hooks/useToolRun";
import { getTool } from "@/lib/tools/registry";
import { ToolError } from "@/lib/tools/process-types";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { UploadZone } from "@/components/ui/UploadZone";
import { ResultPanel } from "@/components/ui/ResultPanel";
import { UsageMeter } from "@/components/ui/UsageMeter";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

interface ImageEntry {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

const ACCEPTED_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/** Returns natural pixel dimensions for an image via a hidden HTMLImageElement. */
function getImageDimensions(
  src: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () =>
      reject(new Error("Não foi possível ler as dimensões da imagem."));
    img.src = src;
  });
}

/** Stable ID factory (module-level counter is fine for a single tool page). */
let _idCounter = 0;
function nextId(): string {
  return `img-${++_idCounter}`;
}

// ──────────────────────────────────────────────────────────────
// Thumbnail sub-component
// ──────────────────────────────────────────────────────────────

interface ThumbnailProps {
  entry: ImageEntry;
  index: number;
  total: number;
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDragStart: (e: React.DragEvent<HTMLLIElement>, id: string) => void;
  onDragOver: (e: React.DragEvent<HTMLLIElement>, id: string) => void;
  onDrop: (e: React.DragEvent<HTMLLIElement>, id: string) => void;
  onDragEnd: () => void;
  isDraggingOver: boolean;
}

function Thumbnail({
  entry,
  index,
  total,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDraggingOver,
}: ThumbnailProps) {
  return (
    <li
      draggable
      onDragStart={(e) => onDragStart(e, entry.id)}
      onDragOver={(e) => onDragOver(e, entry.id)}
      onDrop={(e) => onDrop(e, entry.id)}
      onDragEnd={onDragEnd}
      aria-label={`Imagem ${index + 1} de ${total}: ${entry.name}`}
      className={cn(
        "group relative flex flex-col gap-1 rounded-lg border-2 bg-surface p-1 transition-colors",
        isDraggingOver
          ? "border-brand-500 bg-brand-500/10"
          : "border-border hover:border-brand-500/50",
      )}
    >
      {/* drag handle */}
      <span
        className="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab text-muted opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      >
        <GripVertical size={14} />
      </span>

      {/* page number badge */}
      <span className="absolute right-1 top-1 rounded bg-black/60 px-1 py-0.5 text-[10px] font-semibold text-white select-none">
        {index + 1}
      </span>

      {/* preview */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={entry.previewUrl}
        alt={entry.name}
        draggable={false}
        className="h-24 w-full rounded object-contain"
      />

      {/* filename */}
      <p
        className="truncate px-1 text-center text-xs text-muted"
        title={entry.name}
      >
        {entry.name}
      </p>

      {/* actions */}
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => onMoveUp(entry.id)}
          disabled={index === 0}
          aria-label={`Mover "${entry.name}" para antes`}
          className="rounded p-0.5 text-muted hover:text-fg disabled:cursor-not-allowed disabled:opacity-30"
        >
          <MoveUp size={13} />
        </button>
        <button
          type="button"
          onClick={() => onMoveDown(entry.id)}
          disabled={index === total - 1}
          aria-label={`Mover "${entry.name}" para depois`}
          className="rounded p-0.5 text-muted hover:text-fg disabled:cursor-not-allowed disabled:opacity-30"
        >
          <MoveDown size={13} />
        </button>
        <button
          type="button"
          onClick={() => onRemove(entry.id)}
          aria-label={`Remover "${entry.name}"`}
          className="rounded p-0.5 text-muted hover:text-danger-500"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </li>
  );
}

// ──────────────────────────────────────────────────────────────
// Main runner
// ──────────────────────────────────────────────────────────────

export default function CriarPdfRunner() {
  const tool = getTool("criar-pdf");
  const { state, result, error, run, reset } = useToolRun("criar-pdf");

  const [images, setImages] = useState<ImageEntry[]>([]);
  const dragIdRef = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const anonLimit = tool?.limits.anonPerDay ?? 3;
  const maxMB = tool?.maxSizeMB ?? 25;

  // ── File ingestion ─────────────────────────────────────────

  const handleFiles = useCallback(
    (files: File[]) => {
      const newEntries: ImageEntry[] = [];

      for (const file of files) {
        // Safety net — UploadZone already filters, but we double-check.
        if (!ACCEPTED_MIMES.has(file.type)) continue;
        if (file.size > maxMB * 1024 * 1024) continue;

        newEntries.push({
          id: nextId(),
          file,
          previewUrl: URL.createObjectURL(file),
          name: file.name,
        });
      }

      setImages((prev) => [...prev, ...newEntries]);
    },
    [maxMB],
  );

  // ── List ordering ──────────────────────────────────────────

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const entry = prev.find((e) => e.id === id);
      if (entry) URL.revokeObjectURL(entry.previewUrl);
      return prev.filter((e) => e.id !== id);
    });
  }, []);

  const moveImage = useCallback((id: string, direction: -1 | 1) => {
    setImages((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx < 0) return prev;
      const next = idx + direction;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  }, []);

  // ── Drag-and-drop reorder ──────────────────────────────────

  const handleDragStart = useCallback(
    (_e: React.DragEvent<HTMLLIElement>, id: string) => {
      dragIdRef.current = id;
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLLIElement>, id: string) => {
      e.preventDefault();
      setDragOverId(id);
    },
    [],
  );

  const handleDrop = useCallback(
    (_e: React.DragEvent<HTMLLIElement>, targetId: string) => {
      const sourceId = dragIdRef.current;
      if (!sourceId || sourceId === targetId) return;

      setImages((prev) => {
        const arr = [...prev];
        const srcIdx = arr.findIndex((e) => e.id === sourceId);
        const tgtIdx = arr.findIndex((e) => e.id === targetId);
        if (srcIdx < 0 || tgtIdx < 0) return prev;
        const [removed] = arr.splice(srcIdx, 1);
        arr.splice(tgtIdx, 0, removed);
        return arr;
      });

      dragIdRef.current = null;
      setDragOverId(null);
    },
    [],
  );

  const handleDragEnd = useCallback(() => {
    dragIdRef.current = null;
    setDragOverId(null);
  }, []);

  // ── Clear everything ───────────────────────────────────────

  const clearAll = useCallback(() => {
    setImages((prev) => {
      prev.forEach((e) => URL.revokeObjectURL(e.previewUrl));
      return [];
    });
    reset();
  }, [reset]);

  // ── PDF generation ─────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (images.length === 0) return;

    await run(async () => {
      if (images.length === 0) {
        throw new ToolError(
          "TOOL_FILE_TYPE_INVALID",
          "Adicione pelo menos uma imagem.",
        );
      }

      let pdfDoc: PDFDocument;
      try {
        pdfDoc = await PDFDocument.create();
      } catch {
        throw new ToolError("TOOL_PROCESSING_FAILED");
      }

      for (const entry of images) {
        // Read raw bytes
        let bytes: Uint8Array;
        try {
          const buf = await readFileAsArrayBuffer(entry.file);
          bytes = new Uint8Array(buf);
        } catch {
          throw new ToolError(
            "TOOL_FILE_CORRUPT",
            `Não foi possível ler "${entry.name}".`,
          );
        }

        // Embed image — pdf-lib supports JPEG and PNG natively.
        // WebP needs a canvas round-trip → PNG.
        let embeddedImage;
        try {
          if (entry.file.type === "image/png") {
            embeddedImage = await pdfDoc.embedPng(bytes);
          } else if (entry.file.type === "image/webp") {
            // Convert WebP → PNG via off-screen canvas
            const dims = await getImageDimensions(entry.previewUrl);
            const canvas = document.createElement("canvas");
            canvas.width = dims.width;
            canvas.height = dims.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new ToolError("TOOL_PROCESSING_FAILED");

            await new Promise<void>((resolve, reject) => {
              const img = new Image();
              img.onload = () => {
                ctx.drawImage(img, 0, 0);
                resolve();
              };
              img.onerror = () =>
                reject(
                  new ToolError(
                    "TOOL_FILE_CORRUPT",
                    `Não foi possível converter "${entry.name}".`,
                  ),
                );
              img.src = entry.previewUrl;
            });

            const pngDataUrl = canvas.toDataURL("image/png");
            const base64 = pngDataUrl.split(",")[1];
            if (!base64) throw new ToolError("TOOL_PROCESSING_FAILED");
            const pngBytes = Uint8Array.from(atob(base64), (c) =>
              c.charCodeAt(0),
            );
            embeddedImage = await pdfDoc.embedPng(pngBytes);
          } else {
            // image/jpeg (and any other format that JPEG-decodes fine)
            embeddedImage = await pdfDoc.embedJpg(bytes);
          }
        } catch (e) {
          if (e instanceof ToolError) throw e;
          throw new ToolError(
            "TOOL_FILE_CORRUPT",
            `Imagem inválida ou corrompida: "${entry.name}".`,
          );
        }

        // Page = image natural dimensions (pdf-lib uses points; 1 pt ≈ 1 px at 72 dpi,
        // which is the standard PDF unit and preserves the original proportions exactly).
        const { width, height } = embeddedImage;
        const page = pdfDoc.addPage([width, height]);
        page.drawImage(embeddedImage, { x: 0, y: 0, width, height });
      }

      let pdfBytes: Uint8Array;
      try {
        pdfBytes = await pdfDoc.save();
      } catch {
        throw new ToolError("TOOL_PROCESSING_FAILED");
      }

      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const count = images.length;
      const summary =
        count === 1
          ? "PDF gerado com 1 imagem."
          : `PDF gerado com ${count} imagens.`;

      return { files: [{ name: "documento.pdf", blob }], summary };
    });
  }, [images, run]);

  // ── Render ─────────────────────────────────────────────────

  if (state === "success" && result) {
    return (
      <div className="flex flex-col gap-4">
        <ResultPanel
          result={result}
          toolSlug="criar-pdf"
          onReset={clearAll}
        />
        <UsageMeter used={1} limit={anonLimit} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Upload zone */}
      {state !== "processing" && (
        <UploadZone
          accept={tool?.accept ?? ["image/jpeg", "image/png", "image/webp"]}
          maxSizeMB={maxMB}
          multiple
          toolSlug="criar-pdf"
          onFiles={handleFiles}
        />
      )}

      {/* Processing state */}
      {state === "processing" && (
        <div
          role="status"
          aria-live="polite"
          aria-label="Gerando PDF, aguarde…"
          className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface py-10"
        >
          <Spinner />
          <p className="text-sm text-muted">Gerando PDF…</p>
        </div>
      )}

      {/* Error banner */}
      {state === "error" && error && (
        <p
          role="alert"
          className="rounded-lg bg-danger-500/10 px-4 py-3 text-sm text-danger-700"
        >
          {error}
        </p>
      )}

      {/* Image list with reorder controls */}
      {images.length > 0 && state !== "processing" && (
        <section aria-label="Imagens adicionadas">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-fg">
              {images.length === 1 ? "1 imagem" : `${images.length} imagens`}
              {" — "}
              <span className="font-normal text-muted">
                arraste ou use as setas para reordenar
              </span>
            </h2>
            <button
              type="button"
              onClick={clearAll}
              className="shrink-0 text-xs text-muted underline underline-offset-2 hover:text-danger-500"
              aria-label="Remover todas as imagens"
            >
              Limpar tudo
            </button>
          </div>

          <ul
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
            aria-label="Lista de imagens para o PDF"
          >
            {images.map((entry, idx) => (
              <Thumbnail
                key={entry.id}
                entry={entry}
                index={idx}
                total={images.length}
                onRemove={removeImage}
                onMoveUp={(id) => moveImage(id, -1)}
                onMoveDown={(id) => moveImage(id, 1)}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                isDraggingOver={dragOverId === entry.id}
              />
            ))}
          </ul>
        </section>
      )}

      {/* Generate button */}
      {images.length > 0 && state !== "processing" && (
        <Button
          variant="primary"
          size="lg"
          onClick={handleGenerate}
          aria-label={`Gerar PDF com ${images.length} ${images.length === 1 ? "imagem" : "imagens"}`}
          className="w-full sm:w-auto"
        >
          Gerar PDF
          {images.length > 0 && (
            <span className="ml-1 opacity-70">
              ({images.length}{" "}
              {images.length === 1 ? "imagem" : "imagens"})
            </span>
          )}
        </Button>
      )}

      {/* Usage meter */}
      <UsageMeter used={0} limit={anonLimit} />
    </div>
  );
}
