import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Verify caller is admin
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
  const delta: number = Number(body.delta);
  const reason: string = String(body.reason ?? "").trim();

  if (!Number.isFinite(delta) || delta === 0) {
    return NextResponse.json({ error: "Delta inválido." }, { status: 422 });
  }
  if (!reason) {
    return NextResponse.json({ error: "Motivo obrigatório." }, { status: 422 });
  }

  const admin = createAdminClient();

  // Fetch current balance
  const { data: creditRow, error: fetchErr } = await admin
    .from("credits")
    .select("balance")
    .eq("user_id", targetId)
    .single();

  if (fetchErr && fetchErr.code !== "PGRST116") {
    return NextResponse.json({ error: "Erro ao buscar créditos." }, { status: 500 });
  }

  const currentBalance = creditRow?.balance ?? 0;
  const newBalance = Math.max(0, currentBalance + delta);

  // Upsert credits row
  const { error: upsertErr } = await admin
    .from("credits")
    .upsert({ user_id: targetId, balance: newBalance }, { onConflict: "user_id" });

  if (upsertErr) {
    return NextResponse.json({ error: "Erro ao atualizar créditos." }, { status: 500 });
  }

  // Log transaction
  await admin.from("credit_transactions").insert({
    user_id: targetId,
    delta,
    reason: `admin:${reason}`,
    balance_after: newBalance,
  });

  // Audit log
  await admin.from("audit_logs").insert({
    admin_id: user.id,
    action: delta > 0 ? "credits.grant" : "credits.revoke",
    entity: "credits",
    entity_id: targetId,
    before: { balance: currentBalance },
    after: { balance: newBalance },
    reason,
  });

  return NextResponse.json({ ok: true, newBalance });
}
