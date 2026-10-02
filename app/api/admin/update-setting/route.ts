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
  const { key, value } = body as { key: string; value: unknown };

  if (!key) return NextResponse.json({ error: "key obrigatório." }, { status: 400 });

  const admin = createAdminClient();

  const { error } = await admin
    .from("app_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) {
    console.error("[update-setting]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await admin.from("audit_logs").insert({
    admin_id: user.id,
    action: "update_setting",
    entity: "app_settings",
    entity_id: key,
    after: { value },
  });

  return NextResponse.json({ ok: true });
}
