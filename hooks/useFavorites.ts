"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

/**
 * Client hook that manages the user's favorite tools.
 * Reads from and writes to the `favorites` table via RLS (user must be authenticated).
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user || cancelled) return;
      const { data: rows } = await supabase
        .from("favorites")
        .select("tool_slug")
        .eq("user_id", data.user.id);
      if (!cancelled) {
        setFavorites((rows ?? []).map((r) => r.tool_slug as string));
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback(async (toolSlug: string) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Entre na sua conta para salvar favoritos.");
      return;
    }

    const isFav = favorites.includes(toolSlug);

    // Optimistic update
    setFavorites((prev) =>
      isFav ? prev.filter((s) => s !== toolSlug) : [...prev, toolSlug],
    );

    if (isFav) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("tool_slug", toolSlug);
      if (error) {
        setFavorites((prev) => [...prev, toolSlug]); // rollback
        toast.error("Não foi possível remover o favorito.");
      }
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: user.id, tool_slug: toolSlug });
      if (error) {
        setFavorites((prev) => prev.filter((s) => s !== toolSlug)); // rollback
        toast.error("Não foi possível salvar o favorito.");
      }
    }
  }, [favorites]);

  const isFavorite = useCallback(
    (toolSlug: string) => favorites.includes(toolSlug),
    [favorites],
  );

  return { favorites, loading, toggle, isFavorite };
}
