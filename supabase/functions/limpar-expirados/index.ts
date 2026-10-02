/**
 * limpar-expirados
 *
 * Gatilho: cron diário (ex.: "0 3 * * *" às 03:00 UTC) — configure no supabase/config.toml
 * Entrada: nenhuma (POST sem body, disparado pelo scheduler do Supabase)
 * Saída:   JSON { deleted_generated_files, deleted_uploaded_files, storage_errors[] }
 *
 * Fluxo:
 *  1. Busca generated_files com expires_at < now()  → remove objetos do Storage → deleta linhas
 *  2. Busca uploaded_files  com expires_at < now()  → remove objetos do Storage → deleta linhas
 *  Usa SERVICE_ROLE_KEY (bypassa RLS).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const now = new Date().toISOString();
    const storageErrors: string[] = [];

    // ── 1. generated_files ───────────────────────────────────────────────────
    const { data: generatedRows, error: genFetchErr } = await supabase
      .from("generated_files")
      .select("id, storage_path")
      .lt("expires_at", now);

    if (genFetchErr) throw genFetchErr;

    let deletedGenerated = 0;

    if (generatedRows && generatedRows.length > 0) {
      // Agrupa por bucket — storage_path formato: "<bucket>/<resto>"
      const byBucket: Record<string, string[]> = {};
      for (const row of generatedRows) {
        const [bucket, ...rest] = row.storage_path.split("/");
        if (!byBucket[bucket]) byBucket[bucket] = [];
        byBucket[bucket].push(rest.join("/"));
      }

      for (const [bucket, paths] of Object.entries(byBucket)) {
        const { error: storageErr } = await supabase.storage.from(bucket).remove(paths);
        if (storageErr) storageErrors.push(`storage[${bucket}]: ${storageErr.message}`);
      }

      const ids = generatedRows.map((r) => r.id);
      const { error: delErr } = await supabase.from("generated_files").delete().in("id", ids);
      if (delErr) throw delErr;
      deletedGenerated = ids.length;
    }

    // ── 2. uploaded_files ─────────────────────────────────────────────────────
    const { data: uploadedRows, error: upFetchErr } = await supabase
      .from("uploaded_files")
      .select("id, storage_path")
      .lt("expires_at", now);

    if (upFetchErr) throw upFetchErr;

    let deletedUploaded = 0;

    if (uploadedRows && uploadedRows.length > 0) {
      const byBucket: Record<string, string[]> = {};
      for (const row of uploadedRows) {
        const [bucket, ...rest] = (row.storage_path as string).split("/");
        if (!byBucket[bucket]) byBucket[bucket] = [];
        byBucket[bucket].push(rest.join("/"));
      }

      for (const [bucket, paths] of Object.entries(byBucket)) {
        const { error: storageErr } = await supabase.storage.from(bucket).remove(paths);
        if (storageErr) storageErrors.push(`storage[${bucket}]: ${storageErr.message}`);
      }

      const ids = uploadedRows.map((r) => r.id);
      const { error: delErr } = await supabase.from("uploaded_files").delete().in("id", ids);
      if (delErr) throw delErr;
      deletedUploaded = ids.length;
    }

    const body = JSON.stringify({
      ok: true,
      deleted_generated_files: deletedGenerated,
      deleted_uploaded_files: deletedUploaded,
      storage_errors: storageErrors,
      ran_at: now,
    });

    return new Response(body, {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
