/**
 * remover-fundo
 *
 * Gatilho: POST interno chamado pelo Next.js após upload de imagem.
 * Entrada: JSON { tool_run_id: string, storage_path: string, output_format?: "png"|"webp" }
 * Saída:   JSON { ok: false, code: "BG_REMOVAL_NOT_IMPLEMENTED", message: string }
 *          HTTP 501 — placeholder honesto enquanto a integração com o modelo/API
 *          de remoção de fundo (ex.: Remove.bg, Clipdrop, modelo local REMBG)
 *          não estiver implementada.
 *
 * ─── PONTO DE INTEGRAÇÃO ────────────────────────────────────────────────────
 * Quando o serviço estiver pronto, substitua o bloco marcado com
 * "// TODO: BG_REMOVAL_INTEGRATION" abaixo.
 * Variáveis de ambiente sugeridas: BG_REMOVAL_PROVIDER, BG_REMOVAL_API_KEY,
 *                                  BG_REMOVAL_ENDPOINT
 * ────────────────────────────────────────────────────────────────────────────
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

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ ok: false, error: "Variáveis de ambiente ausentes." }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  let body: { tool_run_id?: string; storage_path?: string; output_format?: "png" | "webp" };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "Body JSON inválido." }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  const { tool_run_id, storage_path } = body;

  if (!tool_run_id || !storage_path) {
    return new Response(
      JSON.stringify({ ok: false, error: "Campos obrigatórios: tool_run_id, storage_path." }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Atualiza o tool_run para refletir que o processamento foi tentado
  await supabase
    .from("tool_runs")
    .update({ status: "failed", options: { error: "BG_REMOVAL_NOT_IMPLEMENTED" } })
    .eq("id", tool_run_id);

  // TODO: BG_REMOVAL_INTEGRATION ──────────────────────────────────────────────
  //
  // 1. Baixe a imagem do Storage:
  //    const { data, error } = await supabase.storage.from("<bucket>").download(storage_path)
  //
  // 2. Envie para o provedor (ex.: Remove.bg via FormData):
  //    const formData = new FormData()
  //    formData.append("image_file", new Blob([await data.arrayBuffer()]))
  //    formData.append("size", "auto")
  //    const res = await fetch("https://api.remove.bg/v1.0/removebg", {
  //      method: "POST",
  //      headers: { "X-Api-Key": Deno.env.get("BG_REMOVAL_API_KEY")! },
  //      body: formData,
  //    })
  //    const resultBlob = await res.blob()
  //
  // 3. Salve o resultado no Storage e em generated_files:
  //    const outputPath = `generated/${tool_run_id}.${body.output_format ?? "png"}`
  //    await supabase.storage.from("generated").upload(outputPath, resultBlob)
  //    await supabase.from("generated_files").insert({ ... })
  //    await supabase.from("tool_runs").update({ status: "done" }).eq("id", tool_run_id)
  //
  // 4. Retorne HTTP 200 com { ok: true, output_path: outputPath }
  //
  // ──────────────────────────────────────────────────────────────────────────

  return new Response(
    JSON.stringify({
      ok: false,
      code: "BG_REMOVAL_NOT_IMPLEMENTED",
      message: "Remoção de fundo em breve. A integração com o modelo de IA ainda não está disponível nesta versão.",
      tool_run_id,
    }),
    {
      status: 501,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    }
  );
});
