import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const body = await req.json();
  const { slug, title, description, h1, content, noindex } = body as {
    slug: string;
    title?: string;
    description?: string;
    h1?: string;
    content?: string;
    noindex?: boolean;
  };

  if (!slug) return NextResponse.json({ error: "slug obrigatório." }, { status: 400 });

  const admin = createAdminClient();
  const patch: Record<string, unknown> = { slug, updated_at: new Date().toISOString() };
  if (title !== undefined) patch.title = title;
  if (description !== undefined) patch.description = description;
  if (h1 !== undefined) patch.h1 = h1;
  if (content !== undefined) patch.content = content;
  if (noindex !== undefined) patch.noindex = noindex;

  const { error } = await admin
    .from("seo_pages")
    .upsert(patch, { onConflict: "slug" });

  if (error) {
    console.error("[update-seo]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await admin.from("audit_logs").insert({
    admin_id: user.id,
    action: "update_seo",
    entity: "seo_pages",
    entity_id: slug,
    after: patch,
  });

  return NextResponse.json({ ok: true });
}
