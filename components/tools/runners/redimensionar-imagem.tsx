"use client";

import { useState, useRef, useCallback } from "react";
import { getTool } from "@/lib/tools/registry";
import { useToolRun } from "@/hooks/useToolRun";
import { ToolError, type ProcessResult } from "@/lib/tools/process-types";
import { UploadZone } from "@/components/ui/UploadZone";
import { ResultPanel } from "@/components/ui/ResultPanel";
import { UsageMeter } from "@/components/ui/UsageMeter";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

const TOOL_SLUG = "redimensionar-imagem";
const tool = getTool(TOOL_SLUG)!;

type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

interface Preset {
  label: string;
  width: number;
  height: number;
}

const PRESETS: Preset[] = [
  { label: "Instagram Post (1080×1080)", width: 1080, height: 1080 },
  { label: "Instagram Story (1080×1920)", width: 1080, height: 1920 },
  { label: "Instagram Paisagem (1080×608)", width: 1080, height: 608 },
  { label: "Facebook Capa (820×312)", width: 820, height: 312 },
  { label: "Twitter/X Header (1500×500)", width: 1500, height: 500 },
  { label: "YouTube Thumbnail (1280×720)", width: 1280, height: 720 },
  { label: "LinkedIn Capa (1584×396)", width: 1584, height: 396 },
  { label: "WhatsApp Status (1080×1920)", width: 1080, height: 1920 },
];

const FORMAT_LABELS: Record<OutputFormat, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
};

const FORMAT_EXT: Record<OutputFormat, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

function parsePositiveInt(raw: string): number | null {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function RedimensionarImagemRunner() {
  const { state, result, error, run, reset } = useToolRun(TOOL_SLUG);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [origWidth, setOrigWidth] = useState<number>(0);
  const [origHeight, setOrigHeight] = useState<number>(0);

  const [widthStr, setWidthStr] = useState<string>("");
  const [heightStr, setHeightStr] = useState<string>("");
  const [keepAspect, setKeepAspect] = useState<boolean>(true);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("image/jpeg");
  const [quality, setQuality] = useState<number>(85);

  const aspectRef = useRef<number>(1);
  const previewUrlRef = useRef<string | null>(null);

  // ---- file loading ----

  const loadPreview = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setOrigWidth(img.naturalWidth);
      setOrigHeight(img.naturalHeight);
      aspectRef.current =
        img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 1;
      setWidthStr(String(img.naturalWidth));
      setHeightStr(String(img.naturalHeight));
      URL.revokeObjectURL(url);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;

    // Separate object URL for the <img> element
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const thumbUrl = URL.createObjectURL(file);
    previewUrlRef.current = thumbUrl;
    setPreview(thumbUrl);
  }, []);

  const handleFiles = useCallback(
    (files: File[]) => {
      const file = files[0];
      if (!file) return;
      if (!tool.accept.includes(file.type)) {
        throw new ToolError("TOOL_FILE_TYPE_INVALID");
      }
      if (file.size > tool.maxSizeMB * 1024 * 1024) {
        throw new ToolError("TOOL_FILE_TOO_LARGE");
      }
      reset();
      setSelectedFile(file);
      loadPreview(file);
    },
    [loadPreview, reset],
  );

  // ---- preset / dimension handlers ----

  const applyPreset = useCallback((preset: Preset) => {
    setWidthStr(String(preset.width));
    setHeightStr(String(preset.height));
    setKeepAspect(false);
  }, []);

  const handleWidthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setWidthStr(val);
      if (keepAspect && aspectRef.current > 0) {
        const w = parsePositiveInt(val);
        if (w !== null) {
          setHeightStr(String(Math.round(w / aspectRef.current)));
        }
      }
    },
    [keepAspect],
  );

  const handleHeightChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setHeightStr(val);
      if (keepAspect && aspectRef.current > 0) {
        const h = parsePositiveInt(val);
        if (h !== null) {
          setWidthStr(String(Math.round(h * aspectRef.current)));
        }
      }
    },
    [keepAspect],
  );

  // ---- canvas processing ----

  const processImage = useCallback(async (): Promise<ProcessResult> => {
    if (!selectedFile) throw new ToolError("TOOL_FILE_TYPE_INVALID");

    const targetW = parsePositiveInt(widthStr);
    const targetH = parsePositiveInt(heightStr);

    if (!targetW || !targetH) {
      throw new ToolError("TOOL_PROCESSING_FAILED", "Largura ou altura inválida.");
    }

    const w = clamp(targetW, 1, 16384);
    const h = clamp(targetH, 1, 16384);

    const bitmapUrl = URL.createObjectURL(selectedFile);

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => {
        URL.revokeObjectURL(bitmapUrl);
        resolve(el);
      };
      el.onerror = () => {
        URL.revokeObjectURL(bitmapUrl);
        reject(new ToolError("TOOL_FILE_CORRUPT"));
      };
      el.src = bitmapUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new ToolError("TOOL_PROCESSING_FAILED", "Canvas não disponível.");

    ctx.drawImage(img, 0, 0, w, h);

    const qualityNorm = outputFormat === "image/png" ? undefined : quality / 100;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (!b) reject(new ToolError("TOOL_PROCESSING_FAILED"));
          else resolve(b);
        },
        outputFormat,
        qualityNorm,
      );
    });

    const ext = FORMAT_EXT[outputFormat];
    const baseName = selectedFile.name.replace(/\.[^.]+$/, "");
    const outName = `${baseName}_${w}x${h}.${ext}`;

    const origSize = selectedFile.size;
    const newSize = blob.size;
    const diff = origSize - newSize;
    const pct = Math.round((Math.abs(diff) / origSize) * 100);
    const sizeNote =
      diff > 0
        ? `${pct}% menor`
        : diff < 0
        ? `${pct}% maior`
        : "mesmo tamanho";

    const summary = `${origWidth}×${origHeight}px → ${w}×${h}px · ${FORMAT_LABELS[outputFormat]} · ${sizeNote}`;

    return { files: [{ name: outName, blob }], summary };
  }, [selectedFile, widthStr, heightStr, outputFormat, quality, origWidth, origHeight]);

  const handleRun = useCallback(() => {
    void run(processImage);
  }, [run, processImage]);

  const handleReset = useCallback(() => {
    reset();
    setSelectedFile(null);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreview(null);
    setWidthStr("");
    setHeightStr("");
    setOrigWidth(0);
    setOrigHeight(0);
  }, [reset]);

  // ---- derived ----

  const hasFile = selectedFile !== null;
  const isProcessing = state === "processing";
  const isSuccess = state === "success";

  const canSubmit =
    hasFile &&
    parsePositiveInt(widthStr) !== null &&
    parsePositiveInt(heightStr) !== null &&
    !isProcessing;

  // ---- render ----

  return (
    <section aria-label="Redimensionar imagem" className="space-y-6">
      {/* Usage meter */}
      <UsageMeter used={0} limit={tool.limits.anonPerDay} />

      {/* Upload */}
      {!hasFile && !isSuccess && (
        <UploadZone
          accept={tool.accept}
          maxSizeMB={tool.maxSizeMB}
          multiple={false}
          toolSlug={TOOL_SLUG}
          onFiles={handleFiles}
        />
      )}

      {/* Controls */}
      {hasFile && !isSuccess && (
        <div className="space-y-5">
          {/* Preview + original info */}
          {preview && (
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="rounded-lg overflow-hidden border border-border bg-surface shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Pré-visualização da imagem carregada"
                  className="max-h-40 max-w-[12rem] object-contain"
                />
              </div>
              <div className="text-sm text-muted space-y-1">
                <p className="font-medium text-foreground truncate max-w-xs">
                  {selectedFile?.name}
                </p>
                {origWidth > 0 && (
                  <p>
                    Dimensões originais:{" "}
                    <span className="font-medium text-foreground">
                      {origWidth}×{origHeight}px
                    </span>
                  </p>
                )}
                <p>
                  Tamanho:{" "}
                  <span className="font-medium text-foreground">
                    {selectedFile
                      ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                      : "—"}
                  </span>
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  aria-label="Remover imagem e escolher outra"
                >
                  Trocar imagem
                </Button>
              </div>
            </div>
          )}

          {/* Presets */}
          <fieldset>
            <legend className="text-sm font-medium text-foreground mb-2">
              Presets de redes sociais
            </legend>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  aria-label={`Aplicar preset ${preset.label}`}
                  onClick={() => applyPreset(preset)}
                  disabled={isProcessing}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-md border transition-colors",
                    "border-border bg-surface text-muted",
                    "hover:bg-brand-500/10 hover:text-brand-600",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Dimensions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Largura (px)"
              id="img-width"
              type="number"
              min={1}
              max={16384}
              value={widthStr}
              onChange={handleWidthChange}
              disabled={isProcessing}
              hint="Entre 1 e 16384"
            />
            <Input
              label="Altura (px)"
              id="img-height"
              type="number"
              min={1}
              max={16384}
              value={heightStr}
              onChange={handleHeightChange}
              disabled={isProcessing}
              hint="Entre 1 e 16384"
            />
          </div>

          {/* Keep aspect ratio */}
          <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={keepAspect}
              onChange={(e) => setKeepAspect(e.target.checked)}
              disabled={isProcessing}
              className="w-4 h-4 rounded accent-brand-500 cursor-pointer disabled:cursor-not-allowed"
              aria-label="Manter proporção da imagem ao alterar dimensões"
            />
            <span className="text-sm text-foreground">Manter proporção</span>
          </label>

          {/* Format */}
          <fieldset>
            <legend className="text-sm font-medium text-foreground mb-2">
              Formato de saída
            </legend>
            <div
              role="radiogroup"
              aria-label="Formato de saída da imagem"
              className="flex gap-3 flex-wrap"
            >
              {(Object.entries(FORMAT_LABELS) as [OutputFormat, string][]).map(
                ([fmt, label]) => (
                  <label
                    key={fmt}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition-colors",
                      outputFormat === fmt
                        ? "border-brand-500 bg-brand-500/10 text-brand-600"
                        : "border-border bg-surface text-muted hover:bg-brand-500/5",
                      isProcessing && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <input
                      type="radio"
                      name="output-format"
                      value={fmt}
                      checked={outputFormat === fmt}
                      onChange={() => setOutputFormat(fmt)}
                      disabled={isProcessing}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                ),
              )}
            </div>
          </fieldset>

          {/* Quality — only for lossy formats */}
          {outputFormat !== "image/png" && (
            <div className="space-y-1">
              <label
                htmlFor="img-quality"
                className="text-sm font-medium text-foreground"
              >
                Qualidade:{" "}
                <span className="text-brand-600">{quality}%</span>
              </label>
              <input
                id="img-quality"
                type="range"
                min={10}
                max={100}
                step={5}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                disabled={isProcessing}
                className="w-full h-2 rounded-full accent-brand-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                aria-valuemin={10}
                aria-valuemax={100}
                aria-valuenow={quality}
              />
              <div className="flex justify-between text-xs text-muted select-none">
                <span>Menor arquivo</span>
                <span>Máxima qualidade</span>
              </div>
            </div>
          )}

          {/* Error banner */}
          {state === "error" && error && (
            <p
              role="alert"
              className="text-sm text-danger-700 bg-danger-500/10 rounded-lg px-3 py-2"
            >
              {error}
            </p>
          )}

          {/* Action */}
          {isProcessing ? (
            <div
              role="status"
              aria-live="polite"
              aria-label="Processando imagem"
              className="flex items-center gap-3 text-muted"
            >
              <Spinner />
              <span className="text-sm">Redimensionando…</span>
            </div>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={handleRun}
              disabled={!canSubmit}
              aria-label="Redimensionar imagem com as configurações selecionadas"
            >
              Redimensionar
            </Button>
          )}
        </div>
      )}

      {/* Result */}
      {isSuccess && result && (
        <ResultPanel
          result={result}
          toolSlug={TOOL_SLUG}
          onReset={handleReset}
        />
      )}
    </section>
  );
}
