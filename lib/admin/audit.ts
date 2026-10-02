import { createAdminClient } from "@/lib/supabase/admin";

export interface WriteAuditParams {
  adminId: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
}

/**
 * Persiste um registro de auditoria em audit_logs.
 * Usa createAdminClient (service-role) — chame SOMENTE de server/route/edge.
 */
export async function writeAudit({
  adminId,
  action,
  entity,
  entityId,
  before,
  after,
  reason,
}: WriteAuditParams): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("audit_logs").insert({
    admin_id: adminId,
    action,
    entity,
    entity_id: entityId ?? null,
    before: before ?? null,
    after: after ?? null,
    reason: reason ?? null,
  });

  if (error) {
    // Não propaga — auditoria nunca deve bloquear a ação principal.
    console.error("[audit] falha ao gravar audit_log:", error.message);
  }
}
