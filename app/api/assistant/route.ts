import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { serverEnv } from "@/lib/env";

export const runtime = "nodejs";

const bodySchema = z.object({
  action: z.enum(["corrigir", "resumir", "melhorar"]),
  text: z.string().min(1, "Texto não pode estar vazio.").max(5000, "Texto muito longo (máx. 5000 caracteres)."),
});

const PROMPTS: Record<"corrigir" | "resumir" | "melhorar", (text: string) => string> = {
  corrigir: (text) =>
    `Você é um revisor de textos em português brasileiro. Corrija gramática, ortografia e pontuação do texto abaixo. Retorne APENAS o texto corrigido, sem explicações ou comentários.\n\nTexto:\n${text}`,
  resumir: (text) =>
    `Você é um especialista em síntese de textos em português brasileiro. Resuma o texto abaixo de forma clara e concisa, preservando as ideias principais. Retorne APENAS o resumo, sem introduções como "O texto fala sobre" ou similares.\n\nTexto:\n${text}`,
  melhorar: (text) =>
    `Você é um redator especialista em português brasileiro. Melhore o estilo e a clareza do texto abaixo, tornando-o mais fluente e profissional, sem alterar seu sentido. Retorne APENAS o texto melhorado, sem explicações.\n\nTexto:\n${text}`,
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Validate API key presence — fail fast before parsing body
  let apiKey: string;
  try {
    apiKey = serverEnv("AI_PROVIDER_API_KEY");
  } catch {
    return NextResponse.json(
      { error: "Assistente indisponível no momento. Configure a chave AI_PROVIDER_API_KEY." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Dados inválidos.";
    return NextResponse.json({ error: firstError }, { status: 422 });
  }

  const { action, text } = parsed.data;
  const prompt = PROMPTS[action](text);

  let anthropicRes: Response;
  try {
    anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Assistente indisponível no momento. Tente novamente em instantes." },
      { status: 503 },
    );
  }

  if (!anthropicRes.ok) {
    const status = anthropicRes.status;
    if (status === 401 || status === 403) {
      return NextResponse.json(
        { error: "Assistente indisponível no momento." },
        { status: 503 },
      );
    }
    if (status === 429) {
      return NextResponse.json(
        { error: "Assistente ocupado. Aguarde alguns instantes e tente de novo." },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "Assistente indisponível no momento. Tente novamente." },
      { status: 503 },
    );
  }

  let data: { content?: { type: string; text: string }[] };
  try {
    data = (await anthropicRes.json()) as typeof data;
  } catch {
    return NextResponse.json({ error: "Resposta inesperada do assistente." }, { status: 500 });
  }

  const resultText = data.content?.find((c) => c.type === "text")?.text ?? "";
  if (!resultText) {
    return NextResponse.json({ error: "O assistente retornou uma resposta vazia." }, { status: 500 });
  }

  return NextResponse.json({ text: resultText });
}
