import type { Metadata } from "next";
import { TOOLS, CATEGORIES, type ToolCategory } from "@/lib/tools/registry";
import { ToolCard } from "@/components/tools/ToolCard";

export const metadata: Metadata = {
  title: "Todas as ferramentas",
  description: "Explore as 15 ferramentas da Praticca: PDF, imagem, texto, negócios, cálculo e validação.",
  alternates: { canonical: "/ferramentas" },
};

export default function CatalogPage() {
  const cats = Object.keys(CATEGORIES) as ToolCategory[];
  return (
    <main className="mx-auto max-w-content px-4 py-12">
      <h1 className="font-display text-3xl font-bold tracking-tight">Ferramentas</h1>
      <p className="mt-2 text-muted">Tudo que você precisa resolver, organizado por categoria.</p>

      {cats.map((cat) => {
        const tools = TOOLS.filter((t) => t.category === cat && t.status !== "hidden");
        if (!tools.length) return null;
        return (
          <section key={cat} className="mt-12">
            <h2 className="font-display text-xl font-semibold">{CATEGORIES[cat].name}</h2>
            <p className="text-sm text-muted">{CATEGORIES[cat].description}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((t) => (
                <ToolCard key={t.slug} tool={t} />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
