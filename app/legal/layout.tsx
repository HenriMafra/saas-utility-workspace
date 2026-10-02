import Link from "next/link";
import type { ReactNode } from "react";

const NAV_LINKS = [
  { href: "/legal/termos", label: "Termos de Uso" },
  { href: "/legal/privacidade", label: "Política de Privacidade" },
  { href: "/legal/cookies", label: "Política de Cookies" },
  { href: "/legal/reembolso", label: "Política de Reembolso" },
];

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Top bar */}
      <header className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="font-display font-bold text-lg text-fg hover:text-brand-600 transition-colors"
            aria-label="Voltar para a página inicial da Praticca"
          >
            Praticca
          </Link>
          <span className="text-muted text-sm" aria-hidden="true">
            /
          </span>
          <span className="text-muted text-sm">Legal</span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 lg:py-14">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar nav */}
          <aside className="lg:w-56 flex-shrink-0" aria-label="Navegação legal">
            <nav>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
                Documentos
              </p>
              <ul className="space-y-1" role="list">
                {NAV_LINKS.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-fg/80 hover:bg-surface hover:text-fg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main content */}
          <main
            id="main-content"
            className="flex-1 min-w-0"
            tabIndex={-1}
          >
            <article className="prose prose-neutral dark:prose-invert max-w-3xl
              prose-headings:font-display prose-headings:text-fg
              prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-2
              prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-base prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-2
              prose-p:text-fg/85 prose-p:leading-relaxed prose-p:my-3
              prose-li:text-fg/85 prose-li:my-1
              prose-a:text-brand-600 hover:prose-a:underline
              prose-strong:text-fg
              prose-hr:border-border">
              {children}
            </article>
          </main>
        </div>
      </div>
    </div>
  );
}
