import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getTool, type ToolDef } from "@/lib/tools/registry";
import { Card } from "@/components/ui/Card";

/** Shared shell for every tool page: hero, runner slot, SEO text, FAQ, related, trust. */
export function ToolLayout({ tool, children }: { tool: ToolDef; children: React.ReactNode }) {
  const related = tool.relatedSlugs.map(getTool).filter(Boolean) as ToolDef[];
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <nav aria-label="breadcrumb" className="mb-4 text-sm text-muted">
        <Link href="/ferramentas" className="hover:underline">
          Ferramentas
        </Link>{" "}
        / <span className="text-fg">{tool.name}</span>
      </nav>

      <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{tool.seo.h1}</h1>
      <p className="mt-3 text-lg text-muted">{tool.shortDescription}</p>

      <div className="mt-8">{children}</div>

      <p className="mt-6 flex items-center gap-2 text-sm text-muted">
        <ShieldCheck className="h-4 w-4 text-success-700" />
        Seus arquivos são processados no seu navegador e apagados automaticamente.
      </p>

      {/* SEO / FAQ */}
      <section className="mt-16 border-t border-border pt-10">
        <h2 className="font-display text-2xl font-semibold">Perguntas frequentes</h2>
        <div className="mt-4 space-y-3">
          {tool.faq.map((f) => (
            <details key={f.q} className="rounded-lg border border-border bg-surface p-4">
              <summary className="cursor-pointer font-medium">{f.q}</summary>
              <p className="mt-2 text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold">Ferramentas relacionadas</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {related.map((r) => (
              <Link key={r.slug} href={`/ferramentas/${r.slug}`}>
                <Card className="p-4 transition-shadow hover:shadow-md">
                  <p className="font-medium">{r.name}</p>
                  <p className="mt-1 text-sm text-muted">{r.shortDescription}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
