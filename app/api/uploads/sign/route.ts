import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTool } from "@/lib/tools/registry";
import { toAppError } from "@/lib/errors/app-error";

const ALLOWED_MIMES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/tiff",
]);

const MAX_ABSOLUTE_SIZE_MB = 100; // limite absoluto da plataforma

const SignUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  mime: z.string().min(1).max(100),
  sizeBytes: z.number().int().positive(),
  toolSlug: z.string().min(1).max(80),
});

/**
 * POST /api/uploads/sign
 * Cria uma URL de upload assinada no bucket privado 'uploads'.
 * Exige autenticação (anon não faz upload server-side).
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Autenticação obrigatória
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

    // 2. Parse e valida body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION", message: "Body JSON inválido." } },
        { status: 422 },
      );
    }

    const parsed = SignUploadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION",
            message: "Campos inválidos.",
            fields: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 422 },
      );
    }

    const { fileName, mime, sizeBytes, toolSlug } = parsed.data;

    // 3. Valida MIME
    if (!ALLOWED_MIMES.has(mime)) {
      return NextResponse.json(
        { ok: false, error: { code: "TOOL_FILE_TYPE_INVALID", message: "Esse formato não é suportado aqui." } },
        { status: 415 },
      );
    }

    // 4. Valida tamanho por ferramenta
    const tool = getTool(toolSlug);
    const maxMB = tool?.maxSizeMB ?? MAX_ABSOLUTE_SIZE_MB;
    const maxBytes = maxMB * 1024 * 1024;

    if (sizeBytes > maxBytes) {
      return NextResponse.json(
        { ok: false, error: { code: "TOOL_FILE_TOO_LARGE", message: "Arquivo acima do limite permitido." } },
        { status: 413 },
      );
    }

    // Valida limite absoluto de plataforma
    if (sizeBytes > MAX_ABSOLUTE_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: { code: "TOOL_FILE_TOO_LARGE", message: "Arquivo acima do limite permitido." } },
        { status: 413 },
      );
    }

    // 5. Valida MIME contra os tipos aceitos pela ferramenta
    if (tool && tool.accept.length > 0 && !tool.accept.includes(mime)) {
      return NextResponse.json(
        { ok: false, error: { code: "TOOL_FILE_TYPE_INVALID", message: "Esse formato não é suportado aqui." } },
        { status: 415 },
      );
    }

    // 6. Cria caminho de storage com namespace por usuário
    const ext = fileName.split(".").pop() ?? "bin";
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
    const storagePath = `${user.id}/${toolSlug}/${Date.now()}_${safeName}.${ext}`;

    // 7. Cria signed upload URL via service-role (bucket privado)
    const admin = createAdminClient();
    const { data: signData, error: signErr } = await admin.storage
      .from("uploads")
      .createSignedUploadUrl(storagePath);

    if (signErr || !signData) {
      console.error("[uploads/sign] createSignedUploadUrl error:", signErr?.message);
      return NextResponse.json(
        { ok: false, error: { code: "UPLOAD_FAILED", message: "Upload caiu. Tentando de novo…" } },
        { status: 500 },
      );
    }

    // 8. Registra metadados do arquivo (sem run_id ainda — será atualizado ao criar o run)
    await admin.from("uploaded_files").insert({
      user_id: user.id,
      storage_path: storagePath,
      mime,
      size_bytes: sizeBytes,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          signedUrl: signData.signedUrl,
          token: signData.token,
          storagePath,
        },
      },
      { status: 200 },
    );
  } catch (e) {
    const err = toAppError(e);
    return NextResponse.json(
      { ok: false, error: { code: err.code, message: err.userMessage } },
      { status: err.httpStatus },
    );
  }
}
