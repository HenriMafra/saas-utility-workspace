"use client";

import * as React from "react";
import { UploadCloud, X } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { track } from "@/lib/analytics/track";

export interface UploadZoneProps {
  accept: string[];
  maxSizeMB: number;
  multiple?: boolean;
  toolSlug?: string;
  onFiles: (files: File[]) => void;
}

export function UploadZone({ accept, maxSizeMB, multiple = false, toolSlug, onFiles }: UploadZoneProps) {
  const [dragging, setDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const maxBytes = maxSizeMB * 1024 * 1024;

  const validate = (files: File[]): File[] | null => {
    for (const f of files) {
      if (accept.length && !accept.includes(f.type)) {
        setError(`Formato não suportado: ${f.name}.`);
        return null;
      }
      if (f.size > maxBytes) {
        setError(`"${f.name}" tem ${formatBytes(f.size)} — o limite é ${maxSizeMB} MB.`);
        return null;
      }
    }
    setError(null);
    return files;
  };

  const handle = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const files = Array.from(fileList);
    const valid = validate(multiple ? files : files.slice(0, 1));
    if (valid) {
      track("file_uploaded", { tool: toolSlug ?? "", count: valid.length });
      onFiles(valid);
    }
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Enviar arquivo"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handle(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-surface px-6 py-12 text-center transition-colors",
          dragging && "border-brand-500 bg-brand-50 dark:bg-brand-900/20",
        )}
      >
        <UploadCloud className="h-10 w-10 text-brand-500" aria-hidden />
        <p className="font-medium text-fg">
          Arraste {multiple ? "seus arquivos" : "seu arquivo"} aqui ou clique para selecionar
        </p>
        <p className="text-sm text-muted">Até {maxSizeMB} MB. Processado no seu navegador.</p>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          aria-label={multiple ? "Enviar arquivos" : "Enviar arquivo"}
          accept={accept.join(",")}
          multiple={multiple}
          onChange={(e) => handle(e.target.files)}
        />
      </div>
      {error && (
        <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-danger-500">
          <X className="h-4 w-4" /> {error}
        </p>
      )}
    </div>
  );
}
