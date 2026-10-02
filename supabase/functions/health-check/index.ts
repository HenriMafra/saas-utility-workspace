/**
 * health-check
 *
 * Gatilho: GET/POST por monitor externo (UptimeRobot, Betterstack, etc.)
 *          ou chamada interna periódica.
 * Entrada: nenhuma
 * Saída:   JSON { status:"ok"|"degraded"|"down", checks:{db, storage}, latency_ms, ts }
 *          Se a tabela system_health_checks existir, grava o resultado.
 *
 * HTTP 200 = ok | 207 = degradado | 503 = down
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CheckResult = { ok: boolean; latency_ms: number; detail?: string };

async function checkDb(supabase: ReturnType<typeof createClient>): Promise<CheckResult> {
  const start = Date.now();
  try {
    // Consulta leve — apenas verifica conectividade
    const { error } = await supabase.from("profiles").select("id").limit(1);
    return { ok: !error, latency_ms: Date.now() - start, detail: error?.message };
  } catch (e) {
    return { ok: false, latency_ms: Date.now() - start, detail: String(e) };
  }
}

async function checkStorage(supabase: ReturnType<typeof createClient>): Promise<CheckResult> {
  const start = Date.now();
  try {
    const { error } = await supabase.storage.listBuckets();
    return { ok: !error, latency_ms: Date.now() - start, detail: error?.message };
  } catch (e) {
    return { ok: false, latency_ms: Date.now() - start, detail: String(e) };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const ts = new Date().toISOString();
  const globalStart = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Variáveis de ambiente ausentes.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const [db, storage] = await Promise.all([checkDb(supabase), checkStorage(supabase)]);

    const allOk = db.ok && storage.ok;
    const anyOk = db.ok || storage.ok;
    const overallStatus = allOk ? "ok" : anyOk ? "degraded" : "down";
    const httpStatus = allOk ? 200 : anyOk ? 207 : 503;

    const payload = {
      status: overallStatus,
      checks: { db, storage },
      latency_ms: Date.now() - globalStart,
      ts,
    };

    // Grava histórico se a tabela existir (ignora erro silenciosamente)
    try {
      await supabase.from("system_health_checks").insert({
        status: overallStatus,
        checks: payload.checks,
        latency_ms: payload.latency_ms,
        created_at: ts,
      });
    } catch {
      // tabela pode não existir — não é fatal
    }

    return new Response(JSON.stringify(payload), {
      status: httpStatus,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ status: "down", error: message, ts }),
      {
        status: 503,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
});
