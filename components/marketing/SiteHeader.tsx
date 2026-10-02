"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

const NAV = [
  { href: "/ferramentas", label: "Ferramentas" },
  { href: "/precos", label: "Preços" },
  { href: "/blog", label: "Blog" },
  { href: "/ajuda", label: "Ajuda" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-4">
        <Link href="/" className="font-display text-xl font-bold tracking-tight">
          Praticca
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Principal">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm text-muted hover:text-fg">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Entrar
            </Button>
          </Link>
          <Link href="/cadastro">
            <Button size="sm">Criar conta</Button>
          </Link>
        </div>
        <button
          className="md:hidden"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-border px-4 py-3 md:hidden" aria-label="Principal (mobile)">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="block py-2 text-sm text-fg"
              onClick={() => setOpen(false)}
            >
              {n.label}
            </Link>
          ))}
          <div className="mt-2 flex gap-2">
            <Link href="/login" className="flex-1">
              <Button variant="secondary" size="sm" className="w-full">
                Entrar
              </Button>
            </Link>
            <Link href="/cadastro" className="flex-1">
              <Button size="sm" className="w-full">
                Criar conta
              </Button>
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
