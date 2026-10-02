import Link from "next/link";
import { CATEGORIES } from "@/lib/tools/registry";

export function SiteFooter() {
  const year = 2026;
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-content gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="font-display text-lg font-bold">Praticca</p>
          <p className="mt-2 text-sm text-muted">
            Tudo que você precisa resolver, em um só lugar.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Categorias</p>
          <ul className="space-y-2 text-sm text-muted">
            {Object.entries(CATEGORIES).map(([slug, c]) => (
              <li key={slug}>
                <Link href={`/categorias/${slug}`} className="hover:text-fg">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Produto</p>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/ferramentas" className="hover:text-fg">Ferramentas</Link></li>
            <li><Link href="/precos" className="hover:text-fg">Preços</Link></li>
            <li><Link href="/blog" className="hover:text-fg">Blog</Link></li>
            <li><Link href="/status" className="hover:text-fg">Status</Link></li>
            <li><Link href="/ajuda" className="hover:text-fg">Ajuda</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Legal</p>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/legal/termos" className="hover:text-fg">Termos de Uso</Link></li>
            <li><Link href="/legal/privacidade" className="hover:text-fg">Privacidade</Link></li>
            <li><Link href="/legal/cookies" className="hover:text-fg">Cookies</Link></li>
            <li><Link href="/legal/reembolso" className="hover:text-fg">Reembolso</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-sm text-muted">
        © {year} Praticca. Feito no Brasil. Seus arquivos são processados no navegador.
      </div>
    </footer>
  );
}
