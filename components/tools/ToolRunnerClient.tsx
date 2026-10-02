"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { Spinner } from "@/components/ui/Spinner";

// min-height reserva o espaço do widget para evitar layout shift (CLS) ao hidratar.
const loading = () => (
  <div className="flex min-h-[420px] items-center justify-center py-16">
    <Spinner />
  </div>
);

/**
 * Client-only registry of tool runners. `ssr: false` keeps the heavy widget JS
 * (pdf-lib, canvas, etc.) OUT of the page's First Load — the SEO content in
 * ToolLayout is still server-rendered. Allowed here because this is a Client Component.
 */
const RUNNERS: Record<string, ComponentType> = {
  "comprimir-pdf": dynamic(() => import("./runners/comprimir-pdf"), { ssr: false, loading }),
  "juntar-pdf": dynamic(() => import("./runners/juntar-pdf"), { ssr: false, loading }),
  "dividir-pdf": dynamic(() => import("./runners/dividir-pdf"), { ssr: false, loading }),
  "converter-pdf": dynamic(() => import("./runners/converter-pdf"), { ssr: false, loading }),
  "criar-pdf": dynamic(() => import("./runners/criar-pdf"), { ssr: false, loading }),
  "assinar-pdf": dynamic(() => import("./runners/assinar-pdf"), { ssr: false, loading }),
  "comprimir-imagem": dynamic(() => import("./runners/comprimir-imagem"), { ssr: false, loading }),
  "redimensionar-imagem": dynamic(() => import("./runners/redimensionar-imagem"), { ssr: false, loading }),
  "remover-fundo": dynamic(() => import("./runners/remover-fundo"), { ssr: false, loading }),
  ocr: dynamic(() => import("./runners/ocr"), { ssr: false, loading }),
  "gerador-de-documentos": dynamic(() => import("./runners/gerador-de-documentos"), { ssr: false, loading }),
  "gerador-de-curriculo": dynamic(() => import("./runners/gerador-de-curriculo"), { ssr: false, loading }),
  calculadoras: dynamic(() => import("./runners/calculadoras"), { ssr: false, loading }),
  "validador-gerador": dynamic(() => import("./runners/validador-gerador"), { ssr: false, loading }),
  "assistente-de-texto": dynamic(() => import("./runners/assistente-de-texto"), { ssr: false, loading }),
};

export function ToolRunnerClient({ slug }: { slug: string }) {
  const Runner = RUNNERS[slug];
  return Runner ? <Runner /> : null;
}
