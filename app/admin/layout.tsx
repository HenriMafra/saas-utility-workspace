import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ScrollText,
  Wrench,
  Settings,
  Flag,
  Globe,
  Bell,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/pagamentos", label: "Pagamentos", icon: CreditCard },
  { href: "/admin/logs", label: "Logs", icon: ScrollText },
  { href: "/admin/ferramentas", label: "Ferramentas", icon: Wrench },
  { href: "/admin/config", label: "Configurações", icon: Settings },
  { href: "/admin/flags", label: "Feature Flags", icon: Flag },
  { href: "/admin/seo", label: "SEO", icon: Globe },
  { href: "/admin/atualizacoes", label: "Atualizações", icon: Bell },
];

export const metadata = { title: "Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, display_name")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/");

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside
        className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex"
        aria-label="Navegação do painel administrativo"
      >
        {/* Brand */}
        <div className="flex h-16 items-center border-b border-border px-5">
          <Link
            href="/admin"
            className="font-display text-base font-bold tracking-tight text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Praticca <span className="text-brand-500">Admin</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Módulos administrativos">
          <ul className="space-y-0.5" role="list">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <AdminNavLink href={href} label={label} Icon={Icon} />
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer do sidebar */}
        <div className="border-t border-border px-4 py-3">
          <p className="truncate text-xs text-muted">
            {profile.display_name || user.email}
          </p>
          <Link
            href="/"
            className="mt-1 text-xs text-brand-500 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500"
          >
            ← Voltar ao site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
          <Link href="/admin" className="font-display text-sm font-bold text-fg">
            Praticca <span className="text-brand-500">Admin</span>
          </Link>
          {/* Mobile nav can be improved with a drawer if needed */}
          <nav className="flex items-center gap-2" aria-label="Módulos (mobile)">
            {NAV_ITEMS.slice(0, 5).map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-label={label}
                title={label}
                className="rounded-md p-1.5 text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <Icon className="h-5 w-5" aria-hidden />
              </Link>
            ))}
          </nav>
        </div>

        <main className="flex-1 overflow-y-auto p-6" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * Rendered as a server component — active state is detected via pathname header set by middleware.
 * Fallback: plain link with accessible label.
 */
function AdminNavLink({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors",
        "hover:bg-bg hover:text-fg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
        "aria-[current=page]:bg-brand-500/10 aria-[current=page]:text-brand-600",
      )}
      aria-label={label}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}
