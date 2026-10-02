import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateToolRunSchema } from "@/schemas/tool-inputs";
import { getTool } from "@/lib/tools/registry";
import { checkLimit } from "@/lib/security/rate-limit";
import { verifyTurnstile } from "@/lib/security/captcha";
import { AppError, toAppError } from "@/lib/errors/app-error";

function jsonError(err: AppError) {
  return NextResponse.json(
    { ok: false, error: { code: err.code, message: err.userMessage } },
    { status: err.httpStatus },
  );
}

export async function POST(req: NextRequest) {
  try {
    // 1. Parse e valida body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION", message: "Body JSON inválido." } },
        { status: 422 },
      );
    }

    const parsed = CreateToolRunSchema.safeParse(body);
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

    const { toolSlug, inputFilePath, options, captchaToken, anonId } = parsed.data;

    // 2. Verifica ferramenta
    const tool = getTool(toolSlug);
    if (!tool || tool.status === "paused" || tool.status === "hidden") {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Ferramenta não encontrada." } },
        { status: 404 },
      );
    }

    // 3. Resolve identidade (auth ou anon)
    const serverSupabase = await createClient();
    const {
      data: { user },
    } = await serverSupabase.auth.getUser();

    // Exige login OU anon_id válido para ferramentas premium
    if (tool.isPremium && !user) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHENTICATED", message: "Você precisa entrar para usar esta ferramenta." } },
        { status: 401 },
      );
    }

    const subject = user?.id ?? anonId ?? null;
    if (!subject) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHENTICATED", message: "Você precisa entrar para usar esta ferramenta." } },
        { status: 401 },
      );
    }

    // 4. Captcha (se configurado e anon)
    if (!user && captchaToken !== undefined) {
      const valid = await verifyTurnstile(captchaToken);
      if (!valid) {
        return NextResponse.json(
          { ok: false, error: { code: "CAPTCHA_FAILED", message: "Verificação de segurança falhou. Recarregue e tente de novo." } },
          { status: 403 },
        );
      }
    }

    // 5. Limite diário
    const isAnon = !user;
    const dailyLimit = isAnon ? tool.limits.anonPerDay : tool.limits.freePerDay;
    const limitResult = await checkLimit(subject, toolSlug, "day", dailyLimit);

    if (!limitResult.allowed) {
      return NextResponse.json(
        { ok: false, error: { code: "RATE_LIMIT_REACHED", message: "Você atingiu o limite de hoje. Assine o Pro ou compre créditos." } },
        { status: 429 },
      );
    }

    // 6. Créditos (somente se tool.creditCost > 0 e usuário autenticado)
    const admin = createAdminClient();
    let creditsSpent = 0;

    if (tool.creditCost > 0 && user) {
      const { data: creditRow, error: creditErr } = await admin
        .from("credits")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (creditErr || !creditRow) {
        return NextResponse.json(
          { ok: false, error: { code: "INSUFFICIENT_CREDITS", message: "Créditos insuficientes para esta ação." } },
          { status: 402 },
        );
      }

      if (creditRow.balance < tool.creditCost) {
        return NextResponse.json(
          { ok: false, error: { code: "INSUFFICIENT_CREDITS", message: "Créditos insuficientes para esta ação." } },
          { status: 402 },
        );
      }

      // Debita créditos — usa subtração com controle de race condition via update condicional
      const newBalance = creditRow.balance - tool.creditCost;
      const { error: debitErr } = await admin
        .from("credits")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .gte("balance", tool.creditCost); // garante atomicidade mínima

      if (debitErr) {
        return NextResponse.json(
          { ok: false, error: { code: "INSUFFICIENT_CREDITS", message: "Créditos insuficientes para esta ação." } },
          { status: 402 },
        );
      }

      // Registra transação
      await admin.from("credit_transactions").insert({
        user_id: user.id,
        delta: -tool.creditCost,
        reason: `tool:${toolSlug}`,
        balance_after: newBalance,
      });

      creditsSpent = tool.creditCost;
    }

    // 7. Determina status inicial: 'queued' para server, 'completed' para client
    const initialStatus = tool.processingMode === "client" ? "completed" : "queued";

    // Calcula expires_at: 24h para runs client, 7 dias para server
    const expiresAt = new Date();
    expiresAt.setHours(
      expiresAt.getHours() + (tool.processingMode === "client" ? 24 : 24 * 7),
    );

    // 8. Cria tool_run
    const { data: run, error: insertErr } = await admin
      .from("tool_runs")
      .insert({
        user_id: user?.id ?? null,
        anon_id: isAnon ? subject : null,
        tool_slug: toolSlug,
        status: initialStatus,
        options: options ?? {},
        credits_spent: creditsSpent,
        expires_at: expiresAt.toISOString(),
      })
      .select("id, status, created_at, expires_at")
      .single();

    if (insertErr || !run) {
      console.error("[tool-runs POST] insert error:", insertErr?.message);
      return NextResponse.json(
        { ok: false, error: { code: "UNKNOWN", message: "Algo deu errado. Tente novamente." } },
        { status: 500 },
      );
    }

    // 9. Registra arquivo de entrada se fornecido
    if (inputFilePath && user) {
      await admin.from("uploaded_files").insert({
        run_id: run.id,
        user_id: user.id,
        storage_path: inputFilePath,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      });
    }

    return NextResponse.json({ ok: true, data: run }, { status: 200 });
  } catch (e) {
    const err = toAppError(e);
    return jsonError(err);
  }
}
