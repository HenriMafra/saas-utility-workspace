import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  History,
  Heart,
  User,
  Zap,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { AppMobileMenu } from "@/components/app/AppMobileMenu";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/favoritos", label: "Favoritos", icon: Heart },
  { href: "/conta", label: "Minha conta", icon: User },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar?next=/dashboard");
  }

  const [{ data: profile }, { data: credits }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, plan")
      .eq("id", user.id)
      .single(),
    supabase
      .from("credits")
      .select("balance")
      .eq("user_id", user.id)
      .single(),
  ]);

  const plan = profile?.plan ?? "free";
  const balance = credits?.balance ?? 0;
  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "Você";

  const planLabel: Record<string, string> = {
    free: "Gratuito",
    pro: "Pro",
    ultra: "Ultra",
  };

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border px-5">
          <Link href="/" className="font-display text-xl font-bold tracking-tight text-fg">
            Praticca
          </Link>
        </div>

        {/* User info */}
        <div className="border-b border-border px-5 py-4">
          <p className="truncate text-sm font-medium text-fg" title={displayName}>
            {displayName}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={plan === "free" ? "neutral" : "brand"} className="capitalize">
              {planLabel[plan] ?? plan}
            </Badge>
            <span className="flex items-center gap-0.5 text-xs text-muted">
              <Zap className="h-3 w-3 text-warning-500" aria-hidden />
              {balance} crédito{balance !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4" aria-label="Área logada">
          <ul className="space-y-0.5" role="list">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-neutral-100 hover:text-fg aria-[current=page]:bg-brand-50 aria-[current=page]:font-medium aria-[current=page]:text-brand-600 dark:hover:bg-neutral-800 dark:aria-[current=page]:bg-brand-900/30 dark:aria-[current=page]:text-brand-300"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" aria-hidden />
                    {label}
                  </span>
                  <ChevronRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Upgrade CTA for free users */}
        {plan === "free" && (
          <div className="border-t border-border p-4">
            <Link
              href="/precos"
              className="flex flex-col gap-1 rounded-lg bg-brand-50 p-3 transition-colors hover:bg-brand-100 dark:bg-brand-900/30 dark:hover:bg-brand-900/50"
            >
              <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300">
                <Zap className="h-3.5 w-3.5" aria-hidden />
                Assine o Pro
              </span>
              <span className="text-xs text-muted">Créditos extras e sem fila</span>
            </Link>
          </div>
        )}
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-surface px-4 md:hidden">
        <Link href="/" className="font-display text-lg font-bold tracking-tight text-fg">
          Praticca
        </Link>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-muted">
            <Zap className="h-3.5 w-3.5 text-warning-500" aria-hidden />
            {balance}
          </span>
          <AppMobileMenu navItems={NAV_ITEMS} displayName={displayName} plan={plan} planLabel={planLabel} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <main
          id="main-content"
          className="flex-1 px-4 pb-10 pt-20 md:px-8 md:pt-8"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
