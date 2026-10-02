import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toAppError } from "@/lib/errors/app-error";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tool-runs/:id
 * Retorna o status e resultado de uma execução de ferramenta.
 * A validação de posse é feita via RLS (server client com sessão do usuário).
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION", message: "ID inválido." } },
        { status: 422 },
      );
    }

    const supabase = await createClient();

    // RLS garante que somente o dono (ou admin) consegue ver o run
    const { data: run, error } = await supabase
      .from("tool_runs")
      .select(
        "id, tool_slug, status, progress, options, credits_spent, error_code, created_at, completed_at, expires_at",
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[tool-runs GET] query error:", error.message);
      return NextResponse.json(
        { ok: false, error: { code: "UNKNOWN", message: "Algo deu errado. Tente novamente." } },
        { status: 500 },
      );
    }

    if (!run) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Não encontramos o que você procura." } },
        { status: 404 },
      );
    }

    // Retorna arquivos gerados associados se status = completed
    let generatedFiles: Array<{ id: string; storage_path: string; mime: string | null; size_bytes: number | null }> = [];
    if (run.status === "completed") {
      const { data: files } = await supabase
        .from("generated_files")
        .select("id, storage_path, mime, size_bytes")
        .eq("run_id", id);
      generatedFiles = files ?? [];
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          ...run,
          generated_files: generatedFiles,
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
