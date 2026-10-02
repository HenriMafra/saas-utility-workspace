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
  const logId: string = String(body.id ?? "").trim();

  if (!logId) {
    return NextResponse.json({ error: "id obrigatório." }, { status: 422 });
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("error_logs")
    .update({ resolved: true })
    .eq("id", logId);

  if (error) {
    return NextResponse.json({ error: "Erro ao resolver log." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
