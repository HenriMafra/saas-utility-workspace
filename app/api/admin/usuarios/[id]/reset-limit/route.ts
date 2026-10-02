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
  const reason: string = String(body.reason ?? "").trim();

  if (!reason) {
    return NextResponse.json({ error: "Motivo obrigatório." }, { status: 422 });
  }

  const admin = createAdminClient();

  // Reset all usage_counters for this user for the current period
  const now = new Date();
  const window = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { error: resetErr } = await admin
    .from("usage_counters")
    .delete()
    .eq("subject", targetId)
    .eq("window", window);

  if (resetErr) {
    return NextResponse.json({ error: "Erro ao resetar limite." }, { status: 500 });
  }

  // Audit log
  await admin.from("audit_logs").insert({
    admin_id: user.id,
    action: "user.reset_limit",
    entity: "usage_counters",
    entity_id: targetId,
    before: null,
    after: { window, reset: true },
    reason,
  });

  return NextResponse.json({ ok: true });
}
