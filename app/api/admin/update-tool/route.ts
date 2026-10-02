import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Auth check — admin only
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
  const { slug, status, credit_cost, is_premium } = body as {
    slug: string;
    status?: "active" | "paused" | "hidden" | "beta";
    credit_cost?: number;
    is_premium?: boolean;
  };

  if (!slug) return NextResponse.json({ error: "slug obrigatório." }, { status: 400 });

  const admin = createAdminClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status !== undefined) patch.status = status;
  if (credit_cost !== undefined) patch.credit_cost = credit_cost;
  if (is_premium !== undefined) patch.is_premium = is_premium;

  const { error } = await admin.from("tools").update(patch).eq("slug", slug);

  if (error) {
    // Table may not exist yet — treat as no-op for now but log
    console.error("[update-tool]", error.message);
  }

  // Audit log
  await admin.from("audit_logs").insert({
    admin_id: user.id,
    action: "update_tool",
    entity: "tool",
    entity_id: slug,
    after: patch,
  });

  return NextResponse.json({ ok: true });
}
