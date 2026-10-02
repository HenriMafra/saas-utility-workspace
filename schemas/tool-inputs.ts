import { z } from "zod";

/** Schema base para criar uma execução de ferramenta. */
export const CreateToolRunSchema = z.object({
  toolSlug: z.string().min(1).max(80),
  inputFilePath: z.string().optional(),
  options: z.record(z.unknown()).optional().default({}),
  captchaToken: z.string().optional(),
  anonId: z.string().uuid().optional(),
});

export type CreateToolRunInput = z.infer<typeof CreateToolRunSchema>;

// ============ Por ferramenta ============

export const ComprimirPdfOptionsSchema = z.object({
  quality: z.enum(["low", "medium", "high"]).default("medium"),
});

export const JuntarPdfOptionsSchema = z.object({
  filePaths: z.array(z.string()).min(2).max(20),
});

export const DividirPdfOptionsSchema = z.object({
  pages: z.string().optional(), // ex: "1-3,5,7-9"
  splitEvery: z.number().int().positive().optional(),
});

export const ConverterPdfOptionsSchema = z.object({
  to: z.enum(["jpg", "png", "pdf"]),
  quality: z.number().int().min(10).max(100).default(90),
});

export const ComprimirImagemOptionsSchema = z.object({
  quality: z.number().int().min(10).max(100).default(80),
  format: z.enum(["jpeg", "png", "webp"]).optional(),
});

export const RedimensionarImagemOptionsSchema = z.object({
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  format: z.enum(["jpeg", "png", "webp"]).optional(),
  fit: z.enum(["cover", "contain", "fill", "inside", "outside"]).default("cover"),
});

export const OcrOptionsSchema = z.object({
  lang: z.string().default("por"),
  outputFormat: z.enum(["text", "json"]).default("text"),
});

export const AssistentDeTextoOptionsSchema = z.object({
  task: z.enum(["correct", "summarize", "improve", "translate"]).default("correct"),
  targetLang: z.string().default("pt-BR"),
  text: z.string().min(1).max(10000),
});

/** Mapa slug → schema de opções (para validação granular). */
export const TOOL_OPTIONS_SCHEMAS: Record<string, z.ZodTypeAny> = {
  "comprimir-pdf": ComprimirPdfOptionsSchema,
  "juntar-pdf": JuntarPdfOptionsSchema,
  "dividir-pdf": DividirPdfOptionsSchema,
  "converter-pdf": ConverterPdfOptionsSchema,
  "comprimir-imagem": ComprimirImagemOptionsSchema,
  "redimensionar-imagem": RedimensionarImagemOptionsSchema,
  ocr: OcrOptionsSchema,
  "assistente-de-texto": AssistentDeTextoOptionsSchema,
};
