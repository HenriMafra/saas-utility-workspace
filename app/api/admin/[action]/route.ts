import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/admin/audit";
import { toAppError } from "@/lib/errors/app-error";

interface RouteContext {
  params: Promise<{ action: string }>;
}

// ============ Schemas por ação ============

const GrantCreditsSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().positive(),
  reason: z.string().optional().default("admin:grant"),
});

const RemoveCreditsSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().positive(),
  reason: z.string().optional().default("admin:remove"),
});

const BlockUserSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().optional(),
});

const UnblockUserSchema = z.object({
  userId: z.string().uuid(),
});

const ResetLimitSchema = z.object({
  subject: z.string().min(1),
  toolSlug: z.string().min(1),
  window: z.string().default("day"),
});

const PauseToolSchema = z.object({
  toolSlug: z.string().min(1),
});

const ActivateToolSchema = z.object({
  toolSlug: z.string().min(1),
});

const UpdateToolSchema = z.object({
  toolSlug: z.string().min(1),
  updates: z.record(z.unknown()),
});

const UpdateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
});

const UpdateFlagSchema = z.object({
  key: z.string().min(1),
  enabled: z.boolean().optional(),
  rolloutPercent: z.number().int().min(0).max(100).optional(),
  target: z.record(z.unknown()).optional(),
});

const UpdateSeoSchema = z.object({
  slug: z.string().min(1),
  updates: z.record(z.unknown()),
});

const ResendWebhookSchema = z.object({
  webhookEventId: z.string().min(1),
});

const ClearExpiredSchema = z.object({
  table: z.enum(["tool_runs", "uploaded_files", "generated_files"]).optional(),
});

// ============ Handler principal ============

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { action } = await params;

    // 1. Autenticação e verificação de admin
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHENTICATED", message: "Você precisa entrar para fazer isso." } },
        { status: 401 },
      );
    }

    const admin = createAdminClient();

    // Verifica is_admin via service-role (sem depender de RLS do servidor)
    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile?.is_admin) {
      return NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Você não tem acesso a isso." } },
        { status: 403 },
      );
    }

    // 2. Parse body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // 3. Despacha por ação
    switch (action) {
      case "grant-credits":
        return handleGrantCredits(body, user.id, admin);

      case "remove-credits":
        return handleRemoveCredits(body, user.id, admin);

      case "block-user":
        return handleBlockUser(body, user.id, admin);

      case "unblock-user":
        return handleUnblockUser(body, user.id, admin);

      case "reset-limit":
        return handleResetLimit(body, user.id, admin);

      case "pause-tool":
        return handlePauseTool(body, user.id, admin);

      case "activate-tool":
        return handleActivateTool(body, user.id, admin);

      case "update-tool":
        return handleUpdateTool(body, user.id, admin);

      case "update-setting":
        return handleUpdateSetting(body, user.id, admin);

      case "update-flag":
        return handleUpdateFlag(body, user.id, admin);

      case "update-seo":
        return handleUpdateSeo(body, user.id, admin);

      case "resend-webhook":
        return handleResendWebhook(body, user.id, admin);

      case "run-health-check":
        return handleRunHealthCheck(user.id, admin);

      case "clear-expired":
        return handleClearExpired(body, user.id, admin);

      default:
        return NextResponse.json(
          { ok: false, error: { code: "NOT_FOUND", message: "Ação não encontrada." } },
          { status: 404 },
        );
    }
  } catch (e) {
    const err = toAppError(e);
    return NextResponse.json(
      { ok: false, error: { code: err.code, message: err.userMessage } },
      { status: err.httpStatus },
    );
  }
}

// ============ Handlers individuais ============

type AdminClient = ReturnType<typeof createAdminClient>;

async function handleGrantCredits(body: unknown, adminId: string, admin: AdminClient) {
  const parsed = GrantCreditsSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { userId, amount, reason } = parsed.data;

  const { data: existing } = await admin
    .from("credits")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  const currentBalance = existing?.balance ?? 0;
  const newBalance = currentBalance + amount;

  const { error } = await admin
    .from("credits")
    .upsert({ user_id: userId, balance: newBalance, updated_at: new Date().toISOString() });

  if (error) return dbError(error.message);

  await admin.from("credit_transactions").insert({
    user_id: userId,
    delta: amount,
    reason,
    balance_after: newBalance,
  });

  await writeAudit({
    adminId,
    action: "grant-credits",
    entity: "credits",
    entityId: userId,
    before: { balance: currentBalance },
    after: { balance: newBalance },
    reason,
  });

  return NextResponse.json({ ok: true, data: { balance: newBalance } });
}

async function handleRemoveCredits(body: unknown, adminId: string, admin: AdminClient) {
  const parsed = RemoveCreditsSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { userId, amount, reason } = parsed.data;

  const { data: existing } = await admin
    .from("credits")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  const currentBalance = existing?.balance ?? 0;
  const newBalance = Math.max(0, currentBalance - amount);

  const { error } = await admin
    .from("credits")
    .upsert({ user_id: userId, balance: newBalance, updated_at: new Date().toISOString() });

  if (error) return dbError(error.message);

  await admin.from("credit_transactions").insert({
    user_id: userId,
    delta: -(currentBalance - newBalance),
    reason,
    balance_after: newBalance,
  });

  await writeAudit({
    adminId,
    action: "remove-credits",
    entity: "credits",
    entityId: userId,
    before: { balance: currentBalance },
    after: { balance: newBalance },
    reason,
  });

  return NextResponse.json({ ok: true, data: { balance: newBalance } });
}

async function handleBlockUser(body: unknown, adminId: string, admin: AdminClient) {
  const parsed = BlockUserSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { userId, reason } = parsed.data;

  // Supabase Auth: ban user via admin API
  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: "876600h", // ~100 anos = bloqueio efetivo permanente
  });

  if (error) return dbError(error.message);

  await writeAudit({ adminId, action: "block-user", entity: "user", entityId: userId, reason });

  return NextResponse.json({ ok: true });
}

async function handleUnblockUser(body: unknown, adminId: string, admin: AdminClient) {
  const parsed = UnblockUserSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { userId } = parsed.data;

  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: "none",
  });

  if (error) return dbError(error.message);

  await writeAudit({ adminId, action: "unblock-user", entity: "user", entityId: userId });

  return NextResponse.json({ ok: true });
}

async function handleResetLimit(body: unknown, adminId: string, admin: AdminClient) {
  const parsed = ResetLimitSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { subject, toolSlug, window } = parsed.data;
  const periodKey = new Date().toISOString().slice(0, 10);

  const { error } = await admin
    .from("usage_counters")
    .delete()
    .eq("subject", subject)
    .eq("tool_slug", toolSlug)
    .eq("window", window)
    .eq("period_key", periodKey);

  if (error) return dbError(error.message);

  await writeAudit({
    adminId,
    action: "reset-limit",
    entity: "usage_counters",
    entityId: `${subject}:${toolSlug}:${window}`,
  });

  return NextResponse.json({ ok: true });
}

async function handlePauseTool(body: unknown, adminId: string, admin: AdminClient) {
  const parsed = PauseToolSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { toolSlug } = parsed.data;

  const { data: before } = await admin.from("tools").select("status").eq("slug", toolSlug).single();

  const { error } = await admin
    .from("tools")
    .update({ status: "paused" })
    .eq("slug", toolSlug);

  if (error) return dbError(error.message);

  await writeAudit({
    adminId,
    action: "pause-tool",
    entity: "tools",
    entityId: toolSlug,
    before,
    after: { status: "paused" },
  });

  return NextResponse.json({ ok: true });
}

async function handleActivateTool(body: unknown, adminId: string, admin: AdminClient) {
  const parsed = ActivateToolSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { toolSlug } = parsed.data;

  const { data: before } = await admin.from("tools").select("status").eq("slug", toolSlug).single();

  const { error } = await admin
    .from("tools")
    .update({ status: "active" })
    .eq("slug", toolSlug);

  if (error) return dbError(error.message);

  await writeAudit({
    adminId,
    action: "activate-tool",
    entity: "tools",
    entityId: toolSlug,
    before,
    after: { status: "active" },
  });

  return NextResponse.json({ ok: true });
}

async function handleUpdateTool(body: unknown, adminId: string, admin: AdminClient) {
  const parsed = UpdateToolSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { toolSlug, updates } = parsed.data;

  const { data: before } = await admin.from("tools").select("*").eq("slug", toolSlug).single();

  // Sanitiza: não permite alterar slug
  const safeUpdates = { ...updates };
  delete (safeUpdates as Record<string, unknown>)["slug"];

  const { error } = await admin.from("tools").update(safeUpdates).eq("slug", toolSlug);
  if (error) return dbError(error.message);

  await writeAudit({
    adminId,
    action: "update-tool",
    entity: "tools",
    entityId: toolSlug,
    before,
    after: updates,
  });

  return NextResponse.json({ ok: true });
}

async function handleUpdateSetting(body: unknown, adminId: string, admin: AdminClient) {
  const parsed = UpdateSettingSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { key, value } = parsed.data;

  const { data: before } = await admin
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  const { error } = await admin
    .from("app_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });

  if (error) return dbError(error.message);

  await writeAudit({
    adminId,
    action: "update-setting",
    entity: "app_settings",
    entityId: key,
    before: before ?? null,
    after: { value },
  });

  return NextResponse.json({ ok: true });
}

async function handleUpdateFlag(body: unknown, adminId: string, admin: AdminClient) {
  const parsed = UpdateFlagSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { key, enabled, rolloutPercent, target } = parsed.data;

  const { data: before } = await admin
    .from("feature_flags")
    .select("*")
    .eq("key", key)
    .maybeSingle();

  const updates: Record<string, unknown> = { key, updated_at: new Date().toISOString() };
  if (enabled !== undefined) updates["enabled"] = enabled;
  if (rolloutPercent !== undefined) updates["rollout_percent"] = rolloutPercent;
  if (target !== undefined) updates["target"] = target;

  const { error } = await admin.from("feature_flags").upsert(updates);
  if (error) return dbError(error.message);

  await writeAudit({
    adminId,
    action: "update-flag",
    entity: "feature_flags",
    entityId: key,
    before: before ?? null,
    after: updates,
  });

  return NextResponse.json({ ok: true });
}

async function handleUpdateSeo(body: unknown, adminId: string, admin: AdminClient) {
  const parsed = UpdateSeoSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { slug, updates } = parsed.data;

  const { data: before } = await admin
    .from("seo_pages")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  const safeUpdates = { ...updates, slug, updated_at: new Date().toISOString() };
  const { error } = await admin.from("seo_pages").upsert(safeUpdates);
  if (error) return dbError(error.message);

  await writeAudit({
    adminId,
    action: "update-seo",
    entity: "seo_pages",
    entityId: slug,
    before: before ?? null,
    after: updates,
  });

  return NextResponse.json({ ok: true });
}

async function handleResendWebhook(body: unknown, adminId: string, admin: AdminClient) {
  const parsed = ResendWebhookSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { webhookEventId } = parsed.data;

  const { data: event, error: fetchErr } = await admin
    .from("webhook_events")
    .select("*")
    .eq("id", webhookEventId)
    .single();

  if (fetchErr || !event) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Evento não encontrado." } },
      { status: 404 },
    );
  }

  // Marca como não-processado para reprocessamento
  const { error: updateErr } = await admin
    .from("webhook_events")
    .update({ processed: false })
    .eq("id", webhookEventId);

  if (updateErr) return dbError(updateErr.message);

  await writeAudit({
    adminId,
    action: "resend-webhook",
    entity: "webhook_events",
    entityId: webhookEventId,
  });

  return NextResponse.json({ ok: true, data: { queued: true } });
}

async function handleRunHealthCheck(adminId: string, admin: AdminClient) {
  const checks: Record<string, boolean | string> = {};

  // Verifica conectividade com o banco
  try {
    const { error } = await admin.from("app_settings").select("key").limit(1);
    checks["database"] = !error;
    if (error) checks["database_error"] = error.message;
  } catch (e) {
    checks["database"] = false;
    checks["database_error"] = String(e);
  }

  // Verifica Storage
  try {
    const { error } = await admin.storage.listBuckets();
    checks["storage"] = !error;
    if (error) checks["storage_error"] = error.message;
  } catch (e) {
    checks["storage"] = false;
    checks["storage_error"] = String(e);
  }

  const allOk = Object.entries(checks)
    .filter(([k]) => !k.endsWith("_error"))
    .every(([, v]) => v === true);

  await writeAudit({
    adminId,
    action: "run-health-check",
    entity: "system",
    after: checks,
  });

  return NextResponse.json({ ok: true, data: { healthy: allOk, checks } });
}

async function handleClearExpired(body: unknown, adminId: string, admin: AdminClient) {
  const parsed = ClearExpiredSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { table } = parsed.data;
  const now = new Date().toISOString();
  const deleted: Record<string, number> = {};

  const tables = table
    ? [table]
    : (["tool_runs", "uploaded_files", "generated_files"] as const);

  for (const t of tables) {
    const { count, error } = await admin
      .from(t)
      .delete({ count: "exact" })
      .lt("expires_at", now)
      .not("expires_at", "is", null);

    if (!error) {
      deleted[t] = count ?? 0;
    } else {
      console.error(`[admin/clear-expired] error on ${t}:`, error.message);
    }
  }

  await writeAudit({
    adminId,
    action: "clear-expired",
    entity: "system",
    after: { deleted },
  });

  return NextResponse.json({ ok: true, data: { deleted } });
}

// ============ Helpers ============

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validationError(error: any) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "VALIDATION",
        message: "Campos inválidos.",
        fields: error?.flatten?.()?.fieldErrors,
      },
    },
    { status: 422 },
  );
}

function dbError(message: string) {
  console.error("[admin] db error:", message);
  return NextResponse.json(
    { ok: false, error: { code: "UNKNOWN", message: "Algo deu errado. Tente novamente." } },
    { status: 500 },
  );
}
