"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { Eraser, PenLine, Info } from "lucide-react";
import { UploadZone } from "@/components/ui/UploadZone";
import { ResultPanel } from "@/components/ui/ResultPanel";
import { UsageMeter } from "@/components/ui/UsageMeter";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { getTool } from "@/lib/tools/registry";
import { useToolRun } from "@/hooks/useToolRun";
import { ToolError } from "@/lib/tools/process-types";

// ─── Types ────────────────────────────────────────────────────────────────────

type PageChoice = "last" | "first" | "custom";
type PositionChoice = "bottom-right" | "bottom-left" | "bottom-center" | "center-right";

interface Point {
  x: number;
  y: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CANVAS_W = 480;
const CANVAS_H = 180;
const SIG_W_PT = 160; // width of the signature image embedded in the PDF (points)
const SIG_H_PT = 60;  // height of the signature image embedded in the PDF (points)
const MARGIN_PT = 20; // distance from page edges

// ─── Signature canvas sub-component ──────────────────────────────────────────

interface SignatureCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isEmpty: boolean;
  setIsEmpty: (v: boolean) => void;
  onClear: () => void;
}

function SignatureCanvas({ canvasRef, isEmpty, setIsEmpty, onClear }: SignatureCanvasProps) {
  const drawing = useRef(false);
  const lastPoint = useRef<Point | null>(null);

  // Initialise canvas with white fill so the PNG export has a clean background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }, [canvasRef]);

  function getPoint(e: React.MouseEvent | React.TouchEvent): Point {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    drawing.current = true;
    lastPoint.current = getPoint(e);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cur = getPoint(e);
    const prev = lastPoint.current ?? cur;
    ctx.beginPath();
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(cur.x, cur.y);
    ctx.stroke();
    lastPoint.current = cur;
    if (isEmpty) setIsEmpty(false);
  }

  function endDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    drawing.current = false;
    lastPoint.current = null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-sm font-medium text-fg">
          <PenLine className="h-4 w-4 text-brand-500" aria-hidden />
          Desenhe sua assinatura
        </label>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Limpar assinatura"
          onClick={onClear}
          leftIcon={<Eraser className="h-4 w-4" />}
        >
          Limpar
        </Button>
      </div>

      {/* The canvas container has touch-action:none so scroll doesn't interfere */}
      <div
        className="overflow-hidden rounded-xl border border-border bg-white shadow-sm"
        style={{ touchAction: "none" }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          role="img"
          aria-label="Área para desenhar a assinatura"
          className="w-full cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>

      {isEmpty && (
        <p className="text-xs text-muted" aria-live="polite">
          A área está em branco. Desenhe sua assinatura acima antes de continuar.
        </p>
      )}
    </div>
  );
}

// ─── Main runner ──────────────────────────────────────────────────────────────

export default function AssinarPdfRunner() {
  const tool = getTool("assinar-pdf");
  const { state, result, error, run, reset } = useToolRun("assinar-pdf");

  // Signature pad state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sigEmpty, setSigEmpty] = useState(true);

  // Options
  const [pageChoice, setPageChoice] = useState<PageChoice>("last");
  const [customPage, setCustomPage] = useState<string>("1");
  const [position, setPosition] = useState<PositionChoice>("bottom-right");

  // Uploaded PDF (held in state so we can use it after the user finishes drawing)
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    setSigEmpty(true);
  }, []);

  function handleReset() {
    clearCanvas();
    setPendingFile(null);
    setTotalPages(null);
    setCustomPage("1");
    reset();
  }

  // Read PDF on upload to discover page count (no full processing yet)
  async function handleFiles(files: File[]) {
    const file = files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      throw new ToolError("TOOL_FILE_TYPE_INVALID");
    }

    let pageCount = 1;
    try {
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
      pageCount = doc.getPageCount();
    } catch (e) {
      const msg = e instanceof Error ? e.message.toLowerCase() : "";
      if (msg.includes("encrypt") || msg.includes("password")) {
        throw new ToolError("TOOL_PDF_LOCKED");
      }
      throw new ToolError("TOOL_FILE_CORRUPT");
    }

    setPendingFile(file);
    setTotalPages(pageCount);
    // Default custom page = last page number
    setCustomPage(String(pageCount));
  }

  // Sign the PDF
  async function handleSign() {
    if (!pendingFile) return;
    if (sigEmpty) return; // guard: user sees inline message

    await run(async () => {
      // 1. Get signature PNG from canvas
      const canvas = canvasRef.current;
      if (!canvas) throw new ToolError("TOOL_PROCESSING_FAILED");

      const signaturePng = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("canvas toBlob failed"));
        }, "image/png");
      });

      const sigBytes = new Uint8Array(await signaturePng.arrayBuffer());

      // 2. Load PDF
      let pdfBytes: ArrayBuffer;
      try {
        pdfBytes = await pendingFile.arrayBuffer();
      } catch {
        throw new ToolError("TOOL_PROCESSING_FAILED");
      }

      let pdfDoc: PDFDocument;
      try {
        pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: false });
      } catch (e) {
        const msg = e instanceof Error ? e.message.toLowerCase() : "";
        if (msg.includes("encrypt") || msg.includes("password")) {
          throw new ToolError("TOOL_PDF_LOCKED");
        }
        throw new ToolError("TOOL_FILE_CORRUPT");
      }

      const pages = pdfDoc.getPages();
      const count = pages.length;

      // 3. Resolve target page index
      let pageIdx: number;
      if (pageChoice === "last") {
        pageIdx = count - 1;
      } else if (pageChoice === "first") {
        pageIdx = 0;
      } else {
        // custom — clamp to valid range
        const n = parseInt(customPage, 10);
        if (isNaN(n) || n < 1) {
          pageIdx = 0;
        } else if (n > count) {
          pageIdx = count - 1;
        } else {
          pageIdx = n - 1;
        }
      }

      const page = pages[pageIdx];
      const { width: pgW, height: pgH } = page.getSize();

      // 4. Embed signature image
      let sigImage;
      try {
        sigImage = await pdfDoc.embedPng(sigBytes);
      } catch {
        throw new ToolError("TOOL_PROCESSING_FAILED");
      }

      // 5. Compute placement (pdf-lib origin is bottom-left)
      let x: number;
      let y: number;

      switch (position) {
        case "bottom-right":
          x = pgW - SIG_W_PT - MARGIN_PT;
          y = MARGIN_PT;
          break;
        case "bottom-left":
          x = MARGIN_PT;
          y = MARGIN_PT;
          break;
        case "bottom-center":
          x = (pgW - SIG_W_PT) / 2;
          y = MARGIN_PT;
          break;
        case "center-right":
          x = pgW - SIG_W_PT - MARGIN_PT;
          y = (pgH - SIG_H_PT) / 2;
          break;
      }

      page.drawImage(sigImage, {
        x,
        y,
        width: SIG_W_PT,
        height: SIG_H_PT,
        opacity: 1,
      });

      // 6. Optionally add a thin border around signature area for visibility
      page.drawRectangle({
        x: x - 2,
        y: y - 2,
        width: SIG_W_PT + 4,
        height: SIG_H_PT + 4,
        borderColor: rgb(0.6, 0.6, 0.6),
        borderWidth: 0.5,
        opacity: 0,
        borderOpacity: 0.5,
      });

      // 7. Save
      let outputBytes: Uint8Array;
      try {
        outputBytes = await pdfDoc.save({ useObjectStreams: true });
      } catch {
        throw new ToolError("TOOL_PROCESSING_FAILED");
      }

      const baseName = pendingFile.name.replace(/\.pdf$/i, "");
      const outputName = `${baseName}-assinado.pdf`;
      const blob = new Blob([outputBytes as BlobPart], { type: "application/pdf" });

      const pageLabel = pageChoice === "last" ? "última página" : pageChoice === "first" ? "primeira página" : `página ${pageIdx + 1}`;
      const posLabel: Record<PositionChoice, string> = {
        "bottom-right": "rodapé direito",
        "bottom-left": "rodapé esquerdo",
        "bottom-center": "rodapé centralizado",
        "center-right": "centro direito",
      };

      return {
        files: [{ name: outputName, blob }],
        summary: `Assinatura adicionada na ${pageLabel}, ${posLabel[position]}.`,
      };
    });
  }

  if (!tool) return null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section aria-label="Assinar PDF" className="flex flex-col gap-6">

      {/* Legal disclaimer — always visible */}
      <div className="flex items-start gap-3 rounded-xl border border-warning-500/40 bg-warning-100/40 px-4 py-3 dark:bg-warning-900/20">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-warning-700" aria-hidden />
        <p className="text-sm text-warning-700">
          <strong>Aviso:</strong> Esta é uma <strong>assinatura visual</strong> inserida no PDF.
          Ela <strong>não substitui</strong> a assinatura digital com certificado ICP-Brasil nem tem
          validade jurídica equivalente para documentos que exijam certificação digital.
        </p>
      </div>

      {/* ── STEP 1: Upload ── */}
      {state === "idle" && !pendingFile && (
        <UploadZone
          accept={tool.accept}
          maxSizeMB={tool.maxSizeMB}
          multiple={false}
          toolSlug={tool.slug}
          onFiles={handleFiles}
        />
      )}

      {/* ── STEP 2: Configure + Draw signature ── */}
      {state === "idle" && pendingFile && (
        <div className="flex flex-col gap-5">
          {/* File info */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate text-sm font-medium text-fg">{pendingFile.name}</span>
              {totalPages !== null && (
                <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                  {totalPages} {totalPages === 1 ? "página" : "páginas"}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              aria-label="Trocar arquivo"
            >
              Trocar
            </Button>
          </div>

          {/* Options */}
          <fieldset className="rounded-xl border border-border bg-surface p-4">
            <legend className="mb-4 text-sm font-semibold text-fg">Opções de assinatura</legend>

            <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
              {/* Page */}
              <div className="flex flex-1 flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  Página
                </span>
                <div className="flex flex-col gap-1.5">
                  {(["last", "first", "custom"] as PageChoice[]).map((val) => (
                    <label
                      key={val}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-bg px-3 py-2 transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 dark:has-[:checked]:bg-brand-900/20"
                    >
                      <input
                        type="radio"
                        name="assinar-pdf-page"
                        value={val}
                        checked={pageChoice === val}
                        onChange={() => setPageChoice(val)}
                        className="accent-brand-500"
                      />
                      <span className="text-sm text-fg">
                        {val === "last" && "Última página"}
                        {val === "first" && "Primeira página"}
                        {val === "custom" && "Página específica"}
                      </span>
                    </label>
                  ))}
                </div>
                {pageChoice === "custom" && (
                  <div className="mt-1">
                    <label htmlFor="assinar-pdf-custom-page" className="sr-only">
                      Número da página
                    </label>
                    <input
                      id="assinar-pdf-custom-page"
                      type="number"
                      min={1}
                      max={totalPages ?? 9999}
                      value={customPage}
                      onChange={(e) => setCustomPage(e.target.value)}
                      className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-brand-500 focus:outline-none"
                      aria-label="Número da página"
                      placeholder={`1–${totalPages ?? "?"}`}
                    />
                  </div>
                )}
              </div>

              {/* Position */}
              <div className="flex flex-1 flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  Posição
                </span>
                <div className="flex flex-col gap-1.5">
                  {(
                    [
                      ["bottom-right", "Rodapé direito"],
                      ["bottom-left", "Rodapé esquerdo"],
                      ["bottom-center", "Rodapé centralizado"],
                      ["center-right", "Centro direito"],
                    ] as [PositionChoice, string][]
                  ).map(([val, label]) => (
                    <label
                      key={val}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-bg px-3 py-2 transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 dark:has-[:checked]:bg-brand-900/20"
                    >
                      <input
                        type="radio"
                        name="assinar-pdf-position"
                        value={val}
                        checked={position === val}
                        onChange={() => setPosition(val)}
                        className="accent-brand-500"
                      />
                      <span className="text-sm text-fg">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </fieldset>

          {/* Signature pad */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <SignatureCanvas
              canvasRef={canvasRef}
              isEmpty={sigEmpty}
              setIsEmpty={setSigEmpty}
              onClear={clearCanvas}
            />
          </div>

          {/* Sign CTA */}
          <Button
            onClick={handleSign}
            disabled={sigEmpty}
            aria-disabled={sigEmpty}
            size="lg"
            className="w-full sm:w-auto sm:self-start"
            leftIcon={<PenLine className="h-5 w-5" />}
          >
            Assinar PDF
          </Button>
        </div>
      )}

      {/* ── Processing ── */}
      {state === "processing" && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface py-14 text-center"
        >
          <Spinner className="h-8 w-8" />
          <p className="text-sm font-medium text-fg">Inserindo assinatura no PDF…</p>
          <p className="text-xs text-muted">Processado no seu navegador — nenhum dado é enviado.</p>
        </div>
      )}

      {/* ── Error ── */}
      {state === "error" && error && (
        <div className="rounded-xl border border-danger-500/30 bg-danger-100/40 p-5">
          <p role="alert" className="text-sm font-medium text-danger-700">
            {error}
          </p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={handleReset}>
            Tentar novamente
          </Button>
        </div>
      )}

      {/* ── Success ── */}
      {state === "success" && result && (
        <ResultPanel
          result={result}
          toolSlug={tool.slug}
          onReset={handleReset}
        />
      )}

      {/* Usage meter */}
      {(state === "idle" || state === "success") && (
        <UsageMeter used={0} limit={tool.limits.anonPerDay} />
      )}
    </section>
  );
}
