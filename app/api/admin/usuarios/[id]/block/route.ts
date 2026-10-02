import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id: targetId } = await params;
  const body = await req.json().catch(() => ({}));
  const blocked: boolean = Boolean(body.blocked);
  const reason: string = String(body.reason ?? "").trim();

  if (!reason) {
    return NextResponse.json({ error: "Motivo obrigatório." }, { status: 422 });
  }

  const admin = createAdminClient();

  // Use Auth admin API to ban/unban user
  const updateFn = blocked
    ? admin.auth.admin.updateUserById(targetId, { ban_duration: "876600h" }) // ~100 years
    : admin.auth.admin.updateUserById(targetId, { ban_duration: "none" });

  const { error: authErr } = await updateFn;
  if (authErr) {
    return NextResponse.json({ error: "Erro ao atualizar usuário." }, { status: 500 });
  }

  // Audit log
  await admin.from("audit_logs").insert({
    admin_id: user.id,
    action: blocked ? "user.block" : "user.unblock",
    entity: "profiles",
    entity_id: targetId,
    before: { blocked: !blocked },
    after: { blocked },
    reason,
  });

  return NextResponse.json({ ok: true, blocked });
}
