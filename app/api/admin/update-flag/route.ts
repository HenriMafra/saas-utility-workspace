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
  const { key, enabled, rollout_percent } = body as {
    key: string;
    enabled?: boolean;
    rollout_percent?: number;
  };

  if (!key) return NextResponse.json({ error: "key obrigatório." }, { status: 400 });

  const admin = createAdminClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (enabled !== undefined) patch.enabled = enabled;
  if (rollout_percent !== undefined) patch.rollout_percent = Math.max(0, Math.min(100, rollout_percent));

  const { error } = await admin.from("feature_flags").update(patch).eq("key", key);

  if (error) {
    console.error("[update-flag]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await admin.from("audit_logs").insert({
    admin_id: user.id,
    action: "update_flag",
    entity: "feature_flags",
    entity_id: key,
    after: patch,
  });

  return NextResponse.json({ ok: true });
}
