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

  const body = await req.json().catch(() => ({}));
  const webhookEventId: string = String(body.webhookEventId ?? "").trim();

  if (!webhookEventId) {
    return NextResponse.json({ error: "webhookEventId obrigatório." }, { status: 422 });
  }

  const admin = createAdminClient();

  // Mark webhook_event as unprocessed so the next processing cycle picks it up
  const { error } = await admin
    .from("webhook_events")
    .update({ processed: false })
    .eq("id", webhookEventId);

  if (error) {
    return NextResponse.json({ error: "Erro ao reenviar webhook." }, { status: 500 });
  }

  // Audit log
  await admin.from("audit_logs").insert({
    admin_id: user.id,
    action: "webhook.resend",
    entity: "webhook_events",
    entity_id: webhookEventId,
    before: { processed: true },
    after: { processed: false },
    reason: "Admin manual resend",
  });

  return NextResponse.json({ ok: true });
}
