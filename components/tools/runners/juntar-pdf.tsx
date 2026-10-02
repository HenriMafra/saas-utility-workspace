"use client";

import { useCallback, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ArrowUp, ArrowDown, Trash2, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { UploadZone } from "@/components/ui/UploadZone";
import { ResultPanel } from "@/components/ui/ResultPanel";
import { UsageMeter } from "@/components/ui/UsageMeter";
import { useToolRun } from "@/hooks/useToolRun";
import { getTool } from "@/lib/tools/registry";
import { ToolError } from "@/lib/tools/process-types";
import { cn, formatBytes } from "@/lib/utils";

const TOOL_SLUG = "juntar-pdf";
const tool = getTool(TOOL_SLUG)!;

interface FileEntry {
  id: string;
  file: File;
}

let idCounter = 0;
function nextId(): string {
  return String(++idCounter);
}

export default function Runner() {
  const { state, result, error, run, reset } = useToolRun(TOOL_SLUG);
  const [entries, setEntries] = useState<FileEntry[]>([]);

  // Add new files, avoiding exact duplicates (same name + size)
  const handleFiles = useCallback((files: File[]) => {
    setEntries((prev) => {
      const next = [...prev];
      for (const f of files) {
        const alreadyIn = next.some(
          (e) => e.file.name === f.name && e.file.size === f.size,
        );
        if (!alreadyIn) {
          next.push({ id: nextId(), file: f });
        }
      }
      return next;
    });
  }, []);

  const moveUp = useCallback((index: number) => {
    if (index === 0) return;
    setEntries((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((index: number) => {
    setEntries((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleReset = useCallback(() => {
    reset();
    setEntries([]);
  }, [reset]);

  const handleMerge = useCallback(() => {
    if (entries.length < 2) return;

    run(async () => {
      // Validate all files are PDFs
      for (const entry of entries) {
        if (entry.file.type !== "application/pdf") {
          throw new ToolError(
            "TOOL_FILE_TYPE_INVALID",
            `"${entry.file.name}" não é um PDF válido.`,
          );
        }
        if (entry.file.size > tool.maxSizeMB * 1024 * 1024) {
          throw new ToolError(
            "TOOL_FILE_TOO_LARGE",
            `"${entry.file.name}" excede o limite de ${tool.maxSizeMB} MB.`,
          );
        }
      }

      let mergedDoc: PDFDocument;
      try {
        mergedDoc = await PDFDocument.create();
      } catch {
        throw new ToolError("TOOL_PROCESSING_FAILED", "Falha ao criar documento PDF.");
      }

      for (const entry of entries) {
        const arrayBuffer = await entry.file.arrayBuffer().catch(() => {
          throw new ToolError("TOOL_FILE_CORRUPT", `Não foi possível ler "${entry.file.name}".`);
        });

        let srcDoc: PDFDocument;
        try {
          srcDoc = await PDFDocument.load(arrayBuffer, {
            ignoreEncryption: false,
          });
        } catch (e) {
          const msg = String(e);
          if (msg.toLowerCase().includes("encrypt") || msg.toLowerCase().includes("password")) {
            throw new ToolError(
              "TOOL_PDF_LOCKED",
              `"${entry.file.name}" está protegido com senha.`,
            );
          }
          throw new ToolError(
            "TOOL_FILE_CORRUPT",
            `Não foi possível abrir "${entry.file.name}".`,
          );
        }

        const pageCount = srcDoc.getPageCount();
        if (pageCount === 0) {
          throw new ToolError(
            "TOOL_FILE_CORRUPT",
            `"${entry.file.name}" não contém páginas.`,
          );
        }

        const copiedPages = await mergedDoc.copyPages(
          srcDoc,
          srcDoc.getPageIndices(),
        );
        for (const page of copiedPages) {
          mergedDoc.addPage(page);
        }
      }

      let pdfBytes: Uint8Array;
      try {
        pdfBytes = await mergedDoc.save();
      } catch {
        throw new ToolError("TOOL_PROCESSING_FAILED", "Falha ao salvar o PDF unido.");
      }

      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const n = entries.length;
      const totalPages = mergedDoc.getPageCount();

      return {
        files: [{ name: "documento-unido.pdf", blob }],
        summary: `${n} arquivo${n !== 1 ? "s" : ""} unidos em 1 PDF (${totalPages} página${totalPages !== 1 ? "s" : ""}).`,
      };
    });
  }, [entries, run]);

  // Success state
  if (state === "success" && result) {
    return (
      <div className="space-y-4">
        <ResultPanel result={result} toolSlug={TOOL_SLUG} onReset={handleReset} />
        <UsageMeter used={0} limit={tool.limits.anonPerDay} />
      </div>
    );
  }

  // Processing state
  if (state === "processing") {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-surface py-16"
        role="status"
        aria-label="Unindo PDFs…"
      >
        <Spinner className="h-10 w-10 text-brand-500" />
        <p className="text-sm font-medium text-muted">Unindo PDFs…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload zone — always visible so user can add more files */}
      <section aria-label="Adicionar arquivos PDF">
        <UploadZone
          accept={tool.accept}
          maxSizeMB={tool.maxSizeMB}
          multiple
          toolSlug={TOOL_SLUG}
          onFiles={handleFiles}
        />
      </section>

      {/* File list */}
      {entries.length > 0 && (
        <section aria-label="Arquivos a juntar" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-fg">
              {entries.length} arquivo{entries.length !== 1 ? "s" : ""} na fila
            </h2>
            <button
              type="button"
              onClick={() => setEntries([])}
              className="text-xs text-muted hover:text-danger-500 transition-colors focus-visible:underline"
              aria-label="Remover todos os arquivos"
            >
              Remover todos
            </button>
          </div>

          <ol className="divide-y divide-border rounded-xl border border-border bg-surface" aria-label="Lista de PDFs na ordem de união">
            {entries.map((entry, index) => (
              <li
                key={entry.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-colors",
                  "first:rounded-t-xl last:rounded-b-xl",
                )}
              >
                {/* Order badge */}
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white"
                  aria-label={`Posição ${index + 1}`}
                >
                  {index + 1}
                </span>

                {/* File icon + info */}
                <FileText className="h-5 w-5 shrink-0 text-muted" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-medium text-fg"
                    title={entry.file.name}
                  >
                    {entry.file.name}
                  </p>
                  <p className="text-xs text-muted">{formatBytes(entry.file.size)}</p>
                </div>

                {/* Reorder controls */}
                <div className="flex shrink-0 items-center gap-1" role="group" aria-label={`Controles de posição para ${entry.file.name}`}>
                  <button
                    type="button"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    aria-label={`Mover "${entry.file.name}" para cima`}
                    className="rounded p-1 text-muted transition-colors hover:bg-neutral-100 hover:text-fg disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={index === entries.length - 1}
                    aria-label={`Mover "${entry.file.name}" para baixo`}
                    className="rounded p-1 text-muted transition-colors hover:bg-neutral-100 hover:text-fg disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(entry.id)}
                    aria-label={`Remover "${entry.file.name}"`}
                    className="rounded p-1 text-muted transition-colors hover:bg-danger-100 hover:text-danger-500 dark:hover:bg-danger-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ol>

          {/* Add more button */}
          <button
            type="button"
            onClick={() => {
              // Trigger the hidden file input inside UploadZone by dispatching a click
              // We rely on the UploadZone above; this is just a visual shortcut hint
              const zoneBtn = document.querySelector<HTMLElement>('[aria-label="Enviar arquivo"]');
              zoneBtn?.click();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-sm text-muted transition-colors hover:border-brand-500 hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Adicionar mais arquivos PDF"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Adicionar mais arquivos
          </button>
        </section>
      )}

      {/* Error message */}
      {state === "error" && error && (
        <p role="alert" className="rounded-lg border border-danger-500/30 bg-danger-100/40 px-4 py-3 text-sm text-danger-700 dark:bg-danger-900/20 dark:text-danger-400">
          {error}
        </p>
      )}

      {/* Merge action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          onClick={handleMerge}
          disabled={entries.length < 2}
          loading={false}
          size="lg"
          aria-disabled={entries.length < 2}
          aria-label={
            entries.length < 2
              ? "Adicione pelo menos 2 PDFs para juntar"
              : `Juntar ${entries.length} PDFs`
          }
        >
          Juntar {entries.length > 0 ? `${entries.length} PDF${entries.length !== 1 ? "s" : ""}` : "PDFs"}
        </Button>

        {entries.length < 2 && (
          <p className="text-xs text-muted">
            {entries.length === 0
              ? "Selecione pelo menos 2 arquivos PDF para continuar."
              : "Adicione mais 1 arquivo PDF para poder juntar."}
          </p>
        )}
      </div>

      {/* Usage meter */}
      <UsageMeter used={0} limit={tool.limits.anonPerDay} />
    </div>
  );
}
