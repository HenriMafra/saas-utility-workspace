import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ToolCard } from "@/components/tools/ToolCard";
import { POPULAR_TOOLS, TOOLS, CATEGORIES } from "@/lib/tools/registry";

export default function HomePage() {
  const popular = POPULAR_TOOLS.length ? POPULAR_TOOLS : TOOLS.slice(0, 6);
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-content px-4 pb-12 pt-16 text-center md:pt-24">
        <h1 className="mx-auto max-w-3xl font-display text-4xl font-bold tracking-tight md:text-6xl">
          Tudo que você precisa resolver, em um só lugar.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
          15 ferramentas rápidas para PDF, imagem, texto e documentos. A maioria roda no seu
          navegador — seus arquivos não saem do seu dispositivo.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/ferramentas/comprimir-pdf">
            <Button size="lg">Comprimir um PDF</Button>
          </Link>
          <Link href="/ferramentas">
            <Button size="lg" variant="secondary" leftIcon={<ArrowRight className="h-4 w-4" />}>
              Ver todas
            </Button>
          </Link>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted">
          <span className="flex items-center gap-2"><Lock className="h-4 w-4 text-success-700" /> Privado por padrão</span>
          <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-brand-500" /> Rápido</span>
          <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success-700" /> Sem vender dados</span>
        </div>
      </section>

      {/* Popular */}
      <section className="mx-auto max-w-content px-4 py-10">
        <h2 className="font-display text-2xl font-semibold">Ferramentas populares</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((t) => (
            <ToolCard key={t.slug} tool={t} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-content px-4 py-10">
        <h2 className="font-display text-2xl font-semibold">Categorias</h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {Object.entries(CATEGORIES).map(([slug, c]) => (
            <Link
              key={slug}
              href={`/categorias/${slug}`}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm hover:border-brand-500"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-content px-4 py-10">
        <h2 className="font-display text-2xl font-semibold">Como funciona</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["1. Envie", "Arraste seu arquivo ou cole seu texto."],
            ["2. Ajuste", "Escolha as opções — tudo no seu navegador."],
            ["3. Baixe", "Baixe o resultado. Apagamos o resto automaticamente."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl border border-border bg-surface p-6">
              <p className="font-medium">{t}</p>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-content px-4 py-16 text-center">
        <div className="rounded-2xl border border-border bg-brand-50 px-6 py-12 dark:bg-brand-900/20">
          <h2 className="font-display text-2xl font-semibold">Comece grátis, sem cadastro</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted">
            Use agora mesmo. Crie uma conta quando quiser salvar histórico e fazer mais.
          </p>
          <Link href="/ferramentas" className="mt-6 inline-block">
            <Button size="lg">Explorar ferramentas</Button>
          </Link>
        </div>
      </section>
    </>
  );
}
