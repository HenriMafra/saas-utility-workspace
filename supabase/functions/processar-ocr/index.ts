/**
 * processar-ocr
 *
 * Gatilho: POST interno chamado pelo Next.js após upload de arquivo para OCR.
 * Entrada: JSON { tool_run_id: string, storage_path: string, locale?: string }
 * Saída:   JSON { ok: false, code: "OCR_NOT_IMPLEMENTED", message: string }
 *          HTTP 501 — placeholder honesto enquanto a integração com o serviço
 *          de OCR (ex.: Google Cloud Vision, AWS Textract, Tesseract via worker)
 *          não estiver implementada.
 *
 * ─── PONTO DE INTEGRAÇÃO ────────────────────────────────────────────────────
 * Quando o serviço de OCR estiver pronto, substitua o bloco marcado com
 * "// TODO: OCR_INTEGRATION" abaixo.
 * Variáveis de ambiente sugeridas: OCR_PROVIDER, OCR_API_KEY, OCR_ENDPOINT
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

  let body: { tool_run_id?: string; storage_path?: string; locale?: string };
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
    .update({ status: "failed", options: { error: "OCR_NOT_IMPLEMENTED" } })
    .eq("id", tool_run_id);

  // TODO: OCR_INTEGRATION ────────────────────────────────────────────────────
  //
  // 1. Baixe o arquivo do Storage:
  //    const { data, error } = await supabase.storage.from("<bucket>").download(storage_path)
  //
  // 2. Envie para o provedor de OCR (ex.: Google Cloud Vision):
  //    const ocrResult = await callOcrProvider(data, { locale: body.locale })
  //
  // 3. Salve o resultado em generated_files ou retorne o texto diretamente:
  //    await supabase.from("tool_runs").update({ status: "done", options: { text: ocrResult.text } }).eq("id", tool_run_id)
  //
  // 4. Retorne HTTP 200 com { ok: true, text: ocrResult.text }
  //
  // ─────────────────────────────────────────────────────────────────────────

  return new Response(
    JSON.stringify({
      ok: false,
      code: "OCR_NOT_IMPLEMENTED",
      message: "OCR server em breve. O processamento de texto em imagens/PDFs ainda não está disponível nesta versão.",
      tool_run_id,
    }),
    {
      status: 501,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    }
  );
});
