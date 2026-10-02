import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ToolCard } from "@/components/tools/ToolCard";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/Button";
import { TOOLS_BY_SLUG } from "@/lib/tools/registry";

export const metadata: Metadata = {
  title: "Favoritos",
  description: "Suas ferramentas Praticca favoritas em um só lugar.",
};

export default async function FavoritosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar?next=/favoritos");

  const { data: rows } = await supabase
    .from("favorites")
    .select("tool_slug")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const favoriteTools = (rows ?? [])
    .map((r) => TOOLS_BY_SLUG[r.tool_slug as string])
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-fg">Favoritos</h1>
        <p className="mt-1 text-sm text-muted">
          {favoriteTools.length > 0
            ? `${favoriteTools.length} ferramenta${favoriteTools.length !== 1 ? "s" : ""} salva${favoriteTools.length !== 1 ? "s" : ""}.`
            : "Salve ferramentas para acessá-las rapidamente."}
        </p>
      </div>

      {favoriteTools.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-5 w-5" />}
          title="Nenhum favorito ainda"
          description="Abra qualquer ferramenta e clique em ♥ para salvá-la aqui."
          action={
            <Link href="/ferramentas">
              <Button size="sm">Explorar ferramentas</Button>
            </Link>
          }
        />
      ) : (
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          role="list"
          aria-label="Ferramentas favoritas"
        >
          {favoriteTools.map((tool) => (
            <div key={tool.slug} role="listitem">
              <ToolCard tool={tool} />
            </div>
          ))}
        </div>
      )}

      {favoriteTools.length > 0 && (
        <p className="text-xs text-muted">
          Para remover um favorito, abra a ferramenta e clique em ♥ novamente.
        </p>
      )}
    </div>
  );
}
