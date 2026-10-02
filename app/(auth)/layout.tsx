import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: {
    default: "Conta | Praticca",
    template: "%s | Praticca",
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-12">
      {/* Logo / brand link */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-md"
          aria-label="Ir para a página inicial da Praticca"
        >
          {/* Replace src with actual logo when available */}
          <span className="font-display text-2xl font-bold text-brand-500 tracking-tight">
            Praticca
          </span>
        </Link>
      </div>

      {/* Card wrapper */}
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-sm">
        {children}
      </div>

      {/* Footer links */}
      <p className="mt-6 text-center text-xs text-muted">
        Ao continuar, você concorda com os{" "}
        <Link href="/legal/termos" className="hover:underline text-muted">
          Termos de Uso
        </Link>{" "}
        e a{" "}
        <Link href="/legal/privacidade" className="hover:underline text-muted">
          Política de Privacidade
        </Link>
        .
      </p>
    </div>
  );
}
