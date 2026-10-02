/**
 * gerar-sitemap
 *
 * Gatilho: POST/GET manual, cron semanal, ou após publicação de conteúdo.
 * Entrada: query param ?save=true  → salva sitemap.xml no Storage público
 *          sem ?save              → apenas retorna o XML na resposta
 * Saída:   application/xml com sitemap completo
 *
 * Fontes de URLs:
 *   1. Rotas estáticas do site (hardcoded)
 *   2. tools (slug de cada ferramenta ativa)
 *   3. seo_pages (slug + updated_at)
 *   4. blog_posts (slug + published_at, apenas published = true)
 *
 * Variáveis de ambiente necessárias:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   SITE_URL (ex.: https://praticca.com.br)
 *   SITEMAP_STORAGE_BUCKET (ex.: "public-assets") — necessário apenas se ?save=true
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rotas estáticas do site Praticca
const STATIC_ROUTES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/ferramentas", changefreq: "weekly", priority: "0.9" },
  { path: "/precos", changefreq: "monthly", priority: "0.8" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  { path: "/sobre", changefreq: "monthly", priority: "0.5" },
  { path: "/contato", changefreq: "monthly", priority: "0.5" },
  { path: "/termos", changefreq: "yearly", priority: "0.3" },
  { path: "/privacidade", changefreq: "yearly", priority: "0.3" },
];

function xmlEscape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc: string, opts?: { lastmod?: string; changefreq?: string; priority?: string }): string {
  const parts = [`  <url>\n    <loc>${xmlEscape(loc)}</loc>`];
  if (opts?.lastmod) parts.push(`    <lastmod>${opts.lastmod.slice(0, 10)}</lastmod>`);
  if (opts?.changefreq) parts.push(`    <changefreq>${opts.changefreq}</changefreq>`);
  if (opts?.priority) parts.push(`    <priority>${opts.priority}</priority>`);
  parts.push("  </url>");
  return parts.join("\n");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const siteUrl = (Deno.env.get("SITE_URL") ?? "https://praticca.com.br").replace(/\/$/, "");
  const storageBucket = Deno.env.get("SITEMAP_STORAGE_BUCKET") ?? "public-assets";

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ ok: false, error: "Variáveis de ambiente ausentes." }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  const url = new URL(req.url);
  const shouldSave = url.searchParams.get("save") === "true";

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const entries: string[] = [];
  const today = new Date().toISOString().slice(0, 10);

  // ── 1. Rotas estáticas ───────────────────────────────────────────────────
  for (const route of STATIC_ROUTES) {
    entries.push(urlEntry(`${siteUrl}${route.path}`, {
      lastmod: today,
      changefreq: route.changefreq,
      priority: route.priority,
    }));
  }

  // ── 2. Ferramentas ────────────────────────────────────────────────────────
  try {
    const { data: tools } = await supabase
      .from("tools")
      .select("slug, updated_at")
      .eq("active", true);

    if (tools) {
      for (const tool of tools) {
        entries.push(urlEntry(`${siteUrl}/ferramentas/${tool.slug}`, {
          lastmod: tool.updated_at ?? today,
          changefreq: "monthly",
          priority: "0.7",
        }));
      }
    }
  } catch {
    // Tabela tools pode ter schema diferente — continua sem parar
  }

  // ── 3. SEO Pages ──────────────────────────────────────────────────────────
  try {
    const { data: seoPages } = await supabase
      .from("seo_pages")
      .select("slug, updated_at");

    if (seoPages) {
      for (const page of seoPages) {
        entries.push(urlEntry(`${siteUrl}/${page.slug}`, {
          lastmod: page.updated_at ?? today,
          changefreq: "monthly",
          priority: "0.6",
        }));
      }
    }
  } catch {
    // Silencioso
  }

  // ── 4. Blog Posts ─────────────────────────────────────────────────────────
  try {
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, published_at, updated_at")
      .eq("published", true)
      .order("published_at", { ascending: false });

    if (posts) {
      for (const post of posts) {
        entries.push(urlEntry(`${siteUrl}/blog/${post.slug}`, {
          lastmod: post.updated_at ?? post.published_at ?? today,
          changefreq: "monthly",
          priority: "0.6",
        }));
      }
    }
  } catch {
    // Silencioso
  }

  // ── Monta XML ─────────────────────────────────────────────────────────────
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
  ].join("\n");

  // ── Salva no Storage se solicitado ────────────────────────────────────────
  if (shouldSave) {
    const encoder = new TextEncoder();
    const { error: uploadError } = await supabase.storage
      .from(storageBucket)
      .upload("sitemap.xml", encoder.encode(xml), {
        contentType: "application/xml",
        upsert: true,
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ ok: false, error: `Erro ao salvar no Storage: ${uploadError.message}` }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, saved: true, url: `${siteUrl}/sitemap.xml`, urls_count: entries.length }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  // Retorna XML diretamente
  return new Response(xml, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
