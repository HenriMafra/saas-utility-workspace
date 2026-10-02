"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Zap, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface AppMobileMenuProps {
  navItems: NavItem[];
  displayName: string;
  plan: string;
  planLabel: Record<string, string>;
}

export function AppMobileMenu({ navItems, displayName, plan, planLabel }: AppMobileMenuProps) {
  const [open, setOpen] = useState(false);
  const { signOut } = useAuth();

  return (
    <>
      <button
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <nav
            id="mobile-nav"
            aria-label="Área logada (mobile)"
            className="fixed inset-y-0 right-0 z-50 flex w-72 flex-col bg-surface shadow-xl"
          >
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <span className="font-display text-base font-bold text-fg">Menu</span>
              <button
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* User info */}
            <div className="border-b border-border px-4 py-3">
              <p className="truncate text-sm font-medium text-fg">{displayName}</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant={plan === "free" ? "neutral" : "brand"} className="capitalize">
                  {planLabel[plan] ?? plan}
                </Badge>
              </div>
            </div>

            {/* Links */}
            <ul className="flex-1 space-y-0.5 px-3 py-3" role="list">
              {navItems.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-neutral-100 hover:text-fg dark:hover:bg-neutral-800"
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" aria-hidden />
                      {label}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 opacity-50" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>

            {/* Footer */}
            <div className="border-t border-border p-4 space-y-2">
              {plan === "free" && (
                <Link
                  href="/precos"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-300"
                >
                  <Zap className="h-4 w-4" aria-hidden />
                  Assinar o Pro
                </Link>
              )}
              <button
                onClick={() => { setOpen(false); void signOut(); }}
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-muted hover:bg-neutral-100 hover:text-fg dark:hover:bg-neutral-800"
              >
                Sair
              </button>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
