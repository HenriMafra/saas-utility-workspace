"use client";

import { useCallback, useId, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { FileText, Scissors } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { UploadZone } from "@/components/ui/UploadZone";
import { ResultPanel } from "@/components/ui/ResultPanel";
import { UsageMeter } from "@/components/ui/UsageMeter";
import { useToolRun } from "@/hooks/useToolRun";
import { getTool } from "@/lib/tools/registry";
import { ToolError } from "@/lib/tools/process-types";
import { cn, formatBytes } from "@/lib/utils";

const TOOL_SLUG = "dividir-pdf";
const tool = getTool(TOOL_SLUG)!;

type SplitMode = "all" | "range";

// ---------------------------------------------------------------------------
// Range parser
// ---------------------------------------------------------------------------

/**
 * Parse a range string like "1-3,5,7-9" into a sorted, deduplicated array
 * of 0-based page indices. Returns null if the string is malformed.
 */
function parseRangeString(raw: string, totalPages: number): number[] | null {
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return null;

  const indices = new Set<number>();

  for (const part of parts) {
    const rangeMatch = /^(\d+)-(\d+)$/.exec(part);
    const singleMatch = /^(\d+)$/.exec(part);

    if (rangeMatch) {
      const from = parseInt(rangeMatch[1], 10);
      const to = parseInt(rangeMatch[2], 10);
      if (isNaN(from) || isNaN(to) || from < 1 || to < from || to > totalPages) return null;
      for (let i = from; i <= to; i++) indices.add(i - 1); // 0-based
    } else if (singleMatch) {
      const page = parseInt(singleMatch[1], 10);
      if (isNaN(page) || page < 1 || page > totalPages) return null;
      indices.add(page - 1);
    } else {
      return null;
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DividirPdfRunner() {
  const { state, result, error, run, reset } = useToolRun(TOOL_SLUG);

  const [mode, setMode] = useState<SplitMode>("all");
  const [rangeInput, setRangeInput] = useState("");
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);

  const modeId = useId();

  // When user selects a file, read its page count for UX feedback
  const handleFiles = useCallback(
    (files: File[]) => {
      const file = files[0];
      if (!file) return;

      setCurrentFile(file);
      setPageCount(null);
      setRangeError(null);

      // Quick peek at page count via pdf-lib
      file.arrayBuffer().then((buf) => {
        PDFDocument.load(buf, { ignoreEncryption: true })
          .then((doc) => setPageCount(doc.getPageCount()))
          .catch(() => setPageCount(null));
      });
    },
    [],
  );

  const handleReset = useCallback(() => {
    reset();
    setCurrentFile(null);
    setPageCount(null);
    setRangeInput("");
    setRangeError(null);
  }, [reset]);

  const validateRange = useCallback((): boolean => {
    if (mode !== "range") return true;
    if (!rangeInput.trim()) {
      setRangeError("Informe o intervalo de páginas.");
      return false;
    }
    if (pageCount !== null) {
      const indices = parseRangeString(rangeInput, pageCount);
      if (!indices) {
        setRangeError(
          `Intervalo inválido. Use números entre 1 e ${pageCount}, ex.: "1-3,5".`,
        );
        return false;
      }
    }
    setRangeError(null);
    return true;
  }, [mode, rangeInput, pageCount]);

  const handleSplit = useCallback(() => {
    if (!currentFile) return;
    if (!validateRange()) return;

    run(async () => {
      // ---- Validate file ----
      if (currentFile.type !== "application/pdf") {
        throw new ToolError(
          "TOOL_FILE_TYPE_INVALID",
          "O arquivo enviado não é um PDF válido.",
        );
      }
      if (currentFile.size > tool.maxSizeMB * 1024 * 1024) {
        throw new ToolError(
          "TOOL_FILE_TOO_LARGE",
          `O arquivo excede o limite de ${tool.maxSizeMB} MB.`,
        );
      }

      // ---- Load source PDF ----
      let arrayBuffer: ArrayBuffer;
      try {
        arrayBuffer = await currentFile.arrayBuffer();
      } catch {
        throw new ToolError("TOOL_PROCESSING_FAILED", "Não foi possível ler o arquivo.");
      }

      let srcDoc: PDFDocument;
      try {
        srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: false });
      } catch (e) {
        const msg = String(e).toLowerCase();
        if (msg.includes("encrypt") || msg.includes("password") || msg.includes("decrypt")) {
          throw new ToolError("TOOL_PDF_LOCKED", "Este PDF está protegido com senha.");
        }
        throw new ToolError("TOOL_FILE_CORRUPT", "Não foi possível abrir o PDF. Arquivo corrompido?");
      }

      const total = srcDoc.getPageCount();
      if (total === 0) {
        throw new ToolError("TOOL_FILE_CORRUPT", "O PDF não contém páginas.");
      }

      // ---- Determine which page indices to produce ----
      type PageGroup = { label: string; indices: number[] };
      let groups: PageGroup[];

      if (mode === "all") {
        // One output file per page
        groups = Array.from({ length: total }, (_, i) => ({
          label: String(i + 1).padStart(String(total).length, "0"),
          indices: [i],
        }));
      } else {
        // Single output file containing the requested range
        const indices = parseRangeString(rangeInput, total);
        if (!indices || indices.length === 0) {
          throw new ToolError(
            "TOOL_PROCESSING_FAILED",
            `Intervalo inválido. Use números entre 1 e ${total}, ex.: "1-3,5".`,
          );
        }
        groups = [{ label: "intervalo", indices }];
      }

      // ---- Build output PDFs ----
      const baseName = currentFile.name.replace(/\.pdf$/i, "");

      const outputFiles: { name: string; blob: Blob }[] = [];

      for (const group of groups) {
        const outDoc = await PDFDocument.create();
        const copiedPages = await outDoc.copyPages(srcDoc, group.indices);
        for (const page of copiedPages) outDoc.addPage(page);

        let bytes: Uint8Array;
        try {
          bytes = await outDoc.save({ useObjectStreams: true });
        } catch {
          throw new ToolError("TOOL_PROCESSING_FAILED", "Falha ao gerar os arquivos de saída.");
        }

        const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
        const suffix = mode === "all" ? `-pagina-${group.label}` : `-${group.label}`;
        outputFiles.push({ name: `${baseName}${suffix}.pdf`, blob });
      }

      // ---- Summary ----
      let summary: string;
      if (mode === "all") {
        summary = `PDF dividido em ${total} arquivo${total !== 1 ? "s" : ""} (1 página cada).`;
      } else {
        const selectedCount = groups[0].indices.length;
        summary = `${selectedCount} página${selectedCount !== 1 ? "s" : ""} extraída${selectedCount !== 1 ? "s" : ""} de "${currentFile.name}".`;
      }

      return { files: outputFiles, summary };
    });
  }, [currentFile, mode, rangeInput, validateRange, run]);

  // ---- Success ----
  if (state === "success" && result) {
    return (
      <div className="space-y-4">
        <ResultPanel result={result} toolSlug={TOOL_SLUG} onReset={handleReset} />
        <UsageMeter used={0} limit={tool.limits.anonPerDay} />
      </div>
    );
  }

  // ---- Processing ----
  if (state === "processing") {
    return (
      <div
        role="status"
        aria-label="Dividindo PDF…"
        aria-live="polite"
        className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-surface py-16"
      >
        <Spinner className="h-10 w-10 text-brand-500" />
        <p className="text-sm font-medium text-muted">Dividindo PDF…</p>
        <p className="text-xs text-muted">Processado no seu navegador — nenhum dado é enviado.</p>
      </div>
    );
  }

  // ---- Idle / Error ----
  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <fieldset className="rounded-xl border border-border bg-surface p-4">
        <legend className="mb-3 text-sm font-semibold text-fg">Modo de divisão</legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          {/* All pages */}
          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border bg-bg p-3 transition-colors",
              mode === "all"
                ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                : "border-border hover:border-brand-500/50",
            )}
          >
            <input
              type="radio"
              name={`${modeId}-mode`}
              value="all"
              checked={mode === "all"}
              onChange={() => {
                setMode("all");
                setRangeError(null);
              }}
              className="mt-0.5 accent-brand-500"
            />
            <span>
              <span className="block text-sm font-medium text-fg">Separar todas as páginas</span>
              <span className="block text-xs text-muted">
                Gera um arquivo PDF por página.
              </span>
            </span>
          </label>

          {/* Range */}
          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border bg-bg p-3 transition-colors",
              mode === "range"
                ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                : "border-border hover:border-brand-500/50",
            )}
          >
            <input
              type="radio"
              name={`${modeId}-mode`}
              value="range"
              checked={mode === "range"}
              onChange={() => setMode("range")}
              className="mt-0.5 accent-brand-500"
            />
            <span>
              <span className="block text-sm font-medium text-fg">Extrair intervalo</span>
              <span className="block text-xs text-muted">
                Selecione páginas específicas (ex.: 1-3,5).
              </span>
            </span>
          </label>
        </div>

        {/* Range input — visible only when mode === "range" */}
        {mode === "range" && (
          <div className="mt-4">
            <Input
              label="Páginas a extrair"
              hint={
                pageCount
                  ? `Ex.: "1-3,5,7" — este PDF tem ${pageCount} página${pageCount !== 1 ? "s" : ""}.`
                  : `Ex.: "1-3,5,7-9"`
              }
              placeholder="1-3,5"
              value={rangeInput}
              onChange={(e) => {
                setRangeInput(e.target.value);
                setRangeError(null);
              }}
              error={rangeError ?? undefined}
              aria-label="Intervalo de páginas a extrair"
              aria-describedby={rangeError ? `${modeId}-range-error` : undefined}
            />
          </div>
        )}
      </fieldset>

      {/* Upload zone / file info */}
      {!currentFile ? (
        <UploadZone
          accept={tool.accept}
          maxSizeMB={tool.maxSizeMB}
          multiple={false}
          toolSlug={TOOL_SLUG}
          onFiles={handleFiles}
        />
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <FileText className="h-8 w-8 shrink-0 text-brand-500" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg" title={currentFile.name}>
              {currentFile.name}
            </p>
            <p className="text-xs text-muted">
              {formatBytes(currentFile.size)}
              {pageCount !== null && ` · ${pageCount} página${pageCount !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="shrink-0 rounded px-2 py-1 text-xs text-muted transition-colors hover:text-danger-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500"
            aria-label="Remover arquivo selecionado"
          >
            Remover
          </button>
        </div>
      )}

      {/* Error alert */}
      {state === "error" && error && (
        <div
          role="alert"
          className="rounded-xl border border-danger-500/30 bg-danger-100/40 px-4 py-3 dark:bg-danger-900/20"
        >
          <p className="text-sm font-medium text-danger-700 dark:text-danger-400">{error}</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={handleReset}>
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          size="lg"
          leftIcon={<Scissors className="h-4 w-4" aria-hidden />}
          onClick={handleSplit}
          disabled={!currentFile}
          loading={false}
          aria-label={currentFile ? "Dividir PDF" : "Selecione um arquivo PDF para continuar"}
        >
          Dividir PDF
        </Button>

        {!currentFile && (
          <p className="text-xs text-muted">
            Selecione um arquivo PDF para continuar.
          </p>
        )}
      </div>

      {/* Usage meter */}
      <UsageMeter used={0} limit={tool.limits.anonPerDay} />
    </div>
  );
}
