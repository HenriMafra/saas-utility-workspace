"use client";

import { CheckCircle2, Download, RefreshCw } from "lucide-react";
import { Button } from "./Button";
import { track } from "@/lib/analytics/track";
import type { ProcessResult } from "@/lib/tools/process-types";

export interface ResultPanelProps {
  result: ProcessResult;
  toolSlug: string;
  onReset?: () => void;
}

export function ResultPanel({ result, toolSlug, onReset }: ResultPanelProps) {
  function download(name: string, blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    track("result_downloaded", { tool: toolSlug });
  }

  return (
    <div className="animate-slide-up rounded-xl border border-success-500/30 bg-success-100/40 p-6">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-success-700" aria-hidden />
        <div className="flex-1">
          <p className="font-medium text-fg">{result.summary}</p>
          <p className="mt-1 text-sm text-muted">
            Apagamos seu arquivo automaticamente. Salve no seu dispositivo se precisar.
          </p>

          {result.text !== undefined && (
            <textarea
              readOnly
              value={result.text}
              className="mt-4 h-40 w-full rounded-md border border-border bg-bg p-3 text-sm"
              aria-label="Texto extraído"
            />
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {result.files.map((f) => (
              <Button key={f.name} leftIcon={<Download className="h-4 w-4" />} onClick={() => download(f.name, f.blob)}>
                Baixar {result.files.length > 1 ? f.name : "arquivo"}
              </Button>
            ))}
            {onReset && (
              <Button variant="secondary" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={onReset}>
                Fazer outro
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
