"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  Search,
  RefreshCw,
  Save,
  ExternalLink,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TOOLS } from "@/lib/tools/registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SeoPage {
  slug: string;
  title: string;
  description: string;
  h1: string;
  content: string;
  noindex: boolean;
  // ui state
  dirty: boolean;
  open: boolean;
  saving: boolean;
}

// ---------------------------------------------------------------------------
// Seed from registry (fallback for pages not in DB)
// ---------------------------------------------------------------------------

function seedFromRegistry(): SeoPage[] {
  // Pages: homepage, ferramentas/[slug], pricing, blog
  const pages: SeoPage[] = [];

  // Home
  pages.push({
    slug: "home",
    title: "Praticca — Ferramentas online para o dia a dia",
    description:
      "Comprima PDFs, remova fundos, gere documentos e muito mais. Grátis, rápido e sem cadastro.",
    h1: "Ferramentas para o dia a dia",
    content: "",
    noindex: false,
    dirty: false,
    open: false,
    saving: false,
  });

  // Tool pages
  for (const tool of TOOLS) {
    pages.push({
      slug: `ferramentas/${tool.slug}`,
      title: tool.seo.title,
      description: tool.seo.description,
      h1: tool.seo.h1,
      content: "",
      noindex: false,
      dirty: false,
      open: false,
      saving: false,
    });
  }

  // Other pages
  for (const [slug, title] of [
    ["precos", "Planos e Preços | Praticca"],
    ["blog", "Blog | Praticca"],
    ["sobre", "Sobre | Praticca"],
    ["privacidade", "Política de Privacidade | Praticca"],
    ["termos", "Termos de Uso | Praticca"],
  ] as [string, string][]) {
    pages.push({
      slug,
      title,
      description: "",
      h1: "",
      content: "",
      noindex: false,
      dirty: false,
      open: false,
      saving: false,
    });
  }

  return pages;
}

async function loadSeoPages(): Promise<Record<string, Partial<SeoPage>>> {
  try {
    const res = await fetch("/api/admin/seo-pages", { cache: "no-store" });
    if (!res.ok) return {};
    const rows: Array<{ slug: string } & Partial<SeoPage>> = await res.json();
    return Object.fromEntries(rows.map((r) => [r.slug, r]));
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SeoAdminPage() {
  const [pages, setPages] = useState<SeoPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadSeoPages().then((remote) => {
      const seeded = seedFromRegistry();
      const merged = seeded.map((p) => {
        const r = remote[p.slug];
        if (!r) return p;
        return {
          ...p,
          title: r.title ?? p.title,
          description: r.description ?? p.description,
          h1: r.h1 ?? p.h1,
          content: r.content ?? p.content,
          noindex: r.noindex ?? p.noindex,
        };
      });
      setPages(merged);
      setLoading(false);
    });
  }, []);

  const filtered = pages.filter(
    (p) =>
      search.trim() === "" ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      p.title.toLowerCase().includes(search.toLowerCase()),
  );

  function patch(slug: string, changes: Partial<SeoPage>) {
    setPages((prev) =>
      prev.map((p) => (p.slug === slug ? { ...p, ...changes, dirty: true } : p)),
    );
  }

  function toggle(slug: string) {
    setPages((prev) =>
      prev.map((p) => (p.slug === slug ? { ...p, open: !p.open } : p)),
    );
  }

  async function save(slug: string) {
    const page = pages.find((p) => p.slug === slug);
    if (!page) return;

    setPages((prev) =>
      prev.map((p) => (p.slug === slug ? { ...p, saving: true } : p)),
    );

    try {
      const res = await fetch("/api/admin/update-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: page.slug,
          title: page.title,
          description: page.description,
          h1: page.h1,
          content: page.content,
          noindex: page.noindex,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao salvar.");
      }
      setPages((prev) =>
        prev.map((p) => (p.slug === slug ? { ...p, dirty: false, saving: false } : p)),
      );
      toast.success(`SEO de "/${slug}" salvo.`);
    } catch (e: unknown) {
      setPages((prev) =>
        prev.map((p) => (p.slug === slug ? { ...p, saving: false } : p)),
      );
      toast.error(e instanceof Error ? e.message : "Erro ao salvar.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" aria-hidden />
        Carregando páginas SEO…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-fg">SEO</h1>
        <p className="mt-1 text-sm text-muted">
          Edite título, descrição, H1 e metadados de indexação de cada página.
        </p>
      </div>

      {/* Busca */}
      <Input
        label=""
        placeholder="Filtrar por slug ou título…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Filtrar páginas SEO"
      />

      {/* Accordion */}
      <div className="space-y-2">
        {filtered.map((page) => (
          <Card key={page.slug} className="p-0 overflow-hidden">
            {/* Row header */}
            <button
              onClick={() => toggle(page.slug)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-surface/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset"
              aria-expanded={page.open}
              aria-controls={`seo-panel-${page.slug}`}
            >
              <div className="flex flex-1 items-center gap-3 min-w-0">
                <Globe className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-xs font-mono text-muted">/{page.slug}</code>
                    {page.noindex && <Badge variant="warning">noindex</Badge>}
                    {page.dirty && <Badge variant="brand">Não salvo</Badge>}
                  </div>
                  {!page.open && page.title && (
                    <p className="truncate text-sm text-fg">{page.title}</p>
                  )}
                </div>
              </div>
              {page.open ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              )}
            </button>

            {/* Panel */}
            {page.open && (
              <div
                id={`seo-panel-${page.slug}`}
                className="space-y-4 border-t border-border px-4 pb-4 pt-4"
              >
                <Input
                  label="Title (tag <title>)"
                  value={page.title}
                  onChange={(e) => patch(page.slug, { title: e.target.value })}
                  hint="Recomendado: 50-60 caracteres."
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-fg" htmlFor={`desc-${page.slug}`}>
                    Description (meta description)
                  </label>
                  <textarea
                    id={`desc-${page.slug}`}
                    value={page.description}
                    onChange={(e) => patch(page.slug, { description: e.target.value })}
                    rows={2}
                    placeholder="Recomendado: 120-160 caracteres."
                    className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted focus-visible:border-brand-500 focus-visible:outline-none"
                  />
                  <p className="mt-1 text-xs text-muted">{page.description.length} caracteres</p>
                </div>
                <Input
                  label="H1 (título principal visível)"
                  value={page.h1}
                  onChange={(e) => patch(page.slug, { h1: e.target.value })}
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-fg" htmlFor={`content-${page.slug}`}>
                    Conteúdo complementar (HTML ou texto)
                  </label>
                  <textarea
                    id={`content-${page.slug}`}
                    value={page.content}
                    onChange={(e) => patch(page.slug, { content: e.target.value })}
                    rows={4}
                    placeholder="Parágrafo de introdução, FAQ adicional, etc."
                    className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm font-mono text-fg placeholder:text-muted focus-visible:border-brand-500 focus-visible:outline-none"
                  />
                </div>

                {/* Noindex */}
                <div className="flex items-center gap-3">
                  <button
                    role="switch"
                    aria-checked={page.noindex}
                    aria-label={`Marcar /${page.slug} como noindex`}
                    onClick={() => patch(page.slug, { noindex: !page.noindex })}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                      page.noindex ? "bg-warning-500" : "bg-border",
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
                        page.noindex ? "translate-x-5" : "translate-x-0",
                      )}
                    />
                  </button>
                  <div>
                    <p className="text-sm font-medium text-fg">Noindex</p>
                    <p className="text-xs text-muted">
                      Quando ativo, esta página não será indexada pelo Google.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <a
                    href={`/${page.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-brand-500 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    Ver página
                  </a>
                  <Button
                    size="sm"
                    variant={page.dirty ? "primary" : "secondary"}
                    disabled={!page.dirty || page.saving}
                    loading={page.saving}
                    onClick={() => save(page.slug)}
                    leftIcon={<Save className="h-4 w-4" aria-hidden />}
                    aria-label={`Salvar SEO de /${page.slug}`}
                  >
                    {page.dirty ? "Salvar" : "Salvo"}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}

        {filtered.length === 0 && (
          <Card>
            <p className="py-8 text-center text-sm text-muted">Nenhuma página encontrada.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
