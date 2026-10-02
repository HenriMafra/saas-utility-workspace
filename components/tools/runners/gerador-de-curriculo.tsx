"use client";

import { useCallback, useId, useState } from "react";
import { jsPDF } from "jspdf";
import { Plus, Trash2 } from "lucide-react";

import { useToolRun } from "@/hooks/useToolRun";
import { getTool } from "@/lib/tools/registry";
import { ToolError } from "@/lib/tools/process-types";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { ResultPanel } from "@/components/ui/ResultPanel";
import { UsageMeter } from "@/components/ui/UsageMeter";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface Experiencia {
  id: string;
  empresa: string;
  cargo: string;
  periodo: string;
  descricao: string;
}

interface Formacao {
  id: string;
  instituicao: string;
  curso: string;
  periodo: string;
}

interface FormData {
  nome: string;
  email: string;
  telefone: string;
  localizacao: string;
  linkedin: string;
  site: string;
  resumo: string;
  experiencias: Experiencia[];
  formacoes: Formacao[];
  habilidades: string;
}

// ─────────────────────────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────────────────────────

function emptyExp(): Experiencia {
  return { id: crypto.randomUUID(), empresa: "", cargo: "", periodo: "", descricao: "" };
}

function emptyForm(): Formacao {
  return { id: crypto.randomUUID(), instituicao: "", curso: "", periodo: "" };
}

const DEFAULT_FORM: FormData = {
  nome: "",
  email: "",
  telefone: "",
  localizacao: "",
  linkedin: "",
  site: "",
  resumo: "",
  experiencias: [emptyExp()],
  formacoes: [emptyForm()],
  habilidades: "",
};

// ─────────────────────────────────────────────────────────────────
// PDF generation (jsPDF, 1-column clean layout)
// ─────────────────────────────────────────────────────────────────

const PAGE_W = 210; // A4 mm
const PAGE_H = 297;
const MARGIN_X = 18;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

function buildPDF(data: FormData): Uint8Array {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // ── Palette ────────────────────────────────────────────────
  const BRAND: [number, number, number] = [37, 99, 235];   // #2563eb
  const DARK: [number, number, number] = [17, 24, 39];     // #111827
  const GRAY: [number, number, number] = [107, 114, 128];  // #6b7280
  const LIGHT: [number, number, number] = [243, 244, 246]; // #f3f4f6
  const LINE: [number, number, number] = [209, 213, 219];  // #d1d5db

  let y = 0;

  // ── Header band ────────────────────────────────────────────
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, PAGE_W, 40, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text(data.nome || "Seu Nome", MARGIN_X, 17);

  // Contact line in header
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(219, 234, 254); // blue-100
  const contactParts: string[] = [];
  if (data.email) contactParts.push(data.email);
  if (data.telefone) contactParts.push(data.telefone);
  if (data.localizacao) contactParts.push(data.localizacao);
  if (data.linkedin) contactParts.push(data.linkedin);
  if (data.site) contactParts.push(data.site);
  if (contactParts.length > 0) {
    doc.text(contactParts.join("  ·  "), MARGIN_X, 26);
  }

  y = 50;

  // ── Helper: section heading ─────────────────────────────────
  function sectionHeading(title: string): void {
    if (y > PAGE_H - 30) { doc.addPage(); y = 20; }
    doc.setFillColor(...LIGHT);
    doc.rect(MARGIN_X, y - 4, CONTENT_W, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...BRAND);
    doc.text(title.toUpperCase(), MARGIN_X + 2, y + 1);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_X, y + 4, MARGIN_X + CONTENT_W, y + 4);
    y += 9;
  }

  // ── Helper: wrapped text with page-break ───────────────────
  function wrappedText(
    text: string,
    x: number,
    maxWidth: number,
    fontSize: number,
    color: [number, number, number],
    fontStyle: "normal" | "bold" = "normal",
    lineHeight = 1.5,
  ): void {
    if (!text.trim()) return;
    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    const lh = (fontSize * lineHeight) / (25.4 / 72); // pt → mm approx
    const lineH = fontSize * lineHeight * 0.3528; // pt → mm
    for (const line of lines) {
      if (y > PAGE_H - 15) { doc.addPage(); y = 20; }
      doc.text(line, x, y);
      y += lineH;
    }
    void lh;
  }

  // ── Resumo ──────────────────────────────────────────────────
  if (data.resumo.trim()) {
    sectionHeading("Resumo Profissional");
    wrappedText(data.resumo, MARGIN_X, CONTENT_W, 9.5, GRAY);
    y += 4;
  }

  // ── Experiências ────────────────────────────────────────────
  const exps = data.experiencias.filter((e) => e.empresa || e.cargo);
  if (exps.length > 0) {
    sectionHeading("Experiência Profissional");
    for (const exp of exps) {
      if (y > PAGE_H - 25) { doc.addPage(); y = 20; }

      // Cargo + empresa on same line
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...DARK);
      const cargoText = [exp.cargo, exp.empresa].filter(Boolean).join(" — ");
      doc.text(cargoText, MARGIN_X, y);

      // Period right-aligned
      if (exp.periodo) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...GRAY);
        doc.text(exp.periodo, MARGIN_X + CONTENT_W, y, { align: "right" });
      }
      y += 4.5;

      if (exp.descricao) {
        wrappedText(exp.descricao, MARGIN_X + 3, CONTENT_W - 3, 9, GRAY);
      }
      y += 4;
    }
  }

  // ── Formação ────────────────────────────────────────────────
  const forms = data.formacoes.filter((f) => f.instituicao || f.curso);
  if (forms.length > 0) {
    sectionHeading("Formação Acadêmica");
    for (const f of forms) {
      if (y > PAGE_H - 20) { doc.addPage(); y = 20; }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...DARK);
      const formText = [f.curso, f.instituicao].filter(Boolean).join(" — ");
      doc.text(formText, MARGIN_X, y);

      if (f.periodo) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...GRAY);
        doc.text(f.periodo, MARGIN_X + CONTENT_W, y, { align: "right" });
      }
      y += 6;
    }
    y += 2;
  }

  // ── Habilidades ─────────────────────────────────────────────
  if (data.habilidades.trim()) {
    sectionHeading("Habilidades");
    const skills = data.habilidades
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (skills.length > 0) {
      const tagH = 6;
      const tagPadX = 3;
      const tagGap = 2.5;
      let rx = MARGIN_X;

      for (const skill of skills) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        const tw = (doc.getStringUnitWidth(skill) * 8.5) / (72 / 25.4);
        const tagW = tw + tagPadX * 2;

        if (rx + tagW > MARGIN_X + CONTENT_W) {
          rx = MARGIN_X;
          y += tagH + tagGap;
          if (y > PAGE_H - 15) { doc.addPage(); y = 20; }
        }

        doc.setFillColor(...LIGHT);
        doc.setDrawColor(...LINE);
        doc.setLineWidth(0.25);
        doc.roundedRect(rx, y - 4, tagW, tagH, 1.5, 1.5, "FD");
        doc.setTextColor(...DARK);
        doc.text(skill, rx + tagPadX, y);
        rx += tagW + tagGap;
      }
      y += tagH + 4;
    }
  }

  return doc.output("arraybuffer") as unknown as Uint8Array;
}

// ─────────────────────────────────────────────────────────────────
// HTML preview builder
// ─────────────────────────────────────────────────────────────────

function buildPreviewHTML(data: FormData): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");

  const contactParts = [data.email, data.telefone, data.localizacao, data.linkedin, data.site]
    .filter(Boolean)
    .map(esc)
    .join(" &middot; ");

  const expsHTML = data.experiencias
    .filter((e) => e.empresa || e.cargo)
    .map(
      (e) => `
    <div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <strong style="color:#111827;font-size:13px">${esc(e.cargo)}${e.cargo && e.empresa ? " — " : ""}${esc(e.empresa)}</strong>
        <span style="color:#6b7280;font-size:11px;flex-shrink:0;margin-left:8px">${esc(e.periodo)}</span>
      </div>
      ${e.descricao ? `<p style="margin:4px 0 0 0;color:#6b7280;font-size:12px;line-height:1.5">${esc(e.descricao)}</p>` : ""}
    </div>`,
    )
    .join("");

  const formsHTML = data.formacoes
    .filter((f) => f.instituicao || f.curso)
    .map(
      (f) => `
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
      <strong style="color:#111827;font-size:13px">${esc(f.curso)}${f.curso && f.instituicao ? " — " : ""}${esc(f.instituicao)}</strong>
      <span style="color:#6b7280;font-size:11px;flex-shrink:0;margin-left:8px">${esc(f.periodo)}</span>
    </div>`,
    )
    .join("");

  const skillTags = data.habilidades
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(
      (s) =>
        `<span style="display:inline-block;background:#f3f4f6;border:1px solid #d1d5db;border-radius:4px;padding:2px 8px;font-size:11px;margin:2px 3px 2px 0;color:#111827">${esc(s)}</span>`,
    )
    .join("");

  function section(title: string, body: string): string {
    if (!body.trim()) return "";
    return `
    <div style="margin-bottom:18px">
      <div style="background:#f3f4f6;padding:4px 6px;margin-bottom:8px;border-left:3px solid #2563eb">
        <span style="font-weight:700;font-size:10px;letter-spacing:.06em;color:#2563eb;text-transform:uppercase">${title}</span>
      </div>
      ${body}
    </div>`;
  }

  return `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:700px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
  <div style="background:#2563eb;color:#fff;padding:20px 24px 16px">
    <h1 style="margin:0 0 4px;font-size:22px;font-weight:700">${esc(data.nome) || "Seu Nome"}</h1>
    ${contactParts ? `<p style="margin:0;font-size:11px;color:#bfdbfe">${contactParts}</p>` : ""}
  </div>
  <div style="padding:20px 24px">
    ${section("Resumo Profissional", data.resumo ? `<p style="color:#6b7280;font-size:12px;line-height:1.6;margin:0">${esc(data.resumo)}</p>` : "")}
    ${section("Experiência Profissional", expsHTML)}
    ${section("Formação Acadêmica", formsHTML)}
    ${section("Habilidades", skillTags)}
  </div>
</div>`;
}

// ─────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────

interface TextAreaFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: string;
}

function TextAreaField({ label, id, value, onChange, placeholder, rows = 3, hint }: TextAreaFieldProps) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-fg">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted focus-visible:border-brand-500 focus-visible:outline-none resize-none"
      />
      {hint && <p className="mt-1.5 text-sm text-muted">{hint}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main runner
// ─────────────────────────────────────────────────────────────────

export default function GeradorDeCurriculoRunner() {
  const tool = getTool("gerador-de-curriculo");
  const { state, result, error, run, reset } = useToolRun("gerador-de-curriculo");

  const anonLimit = tool?.limits.anonPerDay ?? 2;

  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [previewHTML, setPreviewHTML] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "preview">("form");

  const resumoId = useId();
  const habilidadesId = useId();

  // ── Field updater helpers ──────────────────────────────────

  const setField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Experiências
  const addExp = useCallback(() => {
    setForm((prev) => ({ ...prev, experiencias: [...prev.experiencias, emptyExp()] }));
  }, []);
  const removeExp = useCallback((id: string) => {
    setForm((prev) => ({ ...prev, experiencias: prev.experiencias.filter((e) => e.id !== id) }));
  }, []);
  const setExp = useCallback((id: string, field: keyof Omit<Experiencia, "id">, value: string) => {
    setForm((prev) => ({
      ...prev,
      experiencias: prev.experiencias.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  }, []);

  // Formações
  const addFormacao = useCallback(() => {
    setForm((prev) => ({ ...prev, formacoes: [...prev.formacoes, emptyForm()] }));
  }, []);
  const removeFormacao = useCallback((id: string) => {
    setForm((prev) => ({ ...prev, formacoes: prev.formacoes.filter((f) => f.id !== id) }));
  }, []);
  const setFormacao = useCallback((id: string, field: keyof Omit<Formacao, "id">, value: string) => {
    setForm((prev) => ({
      ...prev,
      formacoes: prev.formacoes.map((f) => (f.id === id ? { ...f, [field]: value } : f)),
    }));
  }, []);

  // ── Preview ────────────────────────────────────────────────

  const handlePreview = useCallback(() => {
    if (!form.nome.trim()) {
      // Show inline validation — just focus the field
      const el = document.getElementById("cv-nome");
      el?.focus();
      return;
    }
    setPreviewHTML(buildPreviewHTML(form));
    setStep("preview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [form]);

  const handleBackToForm = useCallback(() => {
    setStep("form");
    setPreviewHTML(null);
  }, []);

  // ── PDF generation ─────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    await run(async () => {
      if (!form.nome.trim()) {
        throw new ToolError("TOOL_PROCESSING_FAILED", "Informe pelo menos seu nome completo.");
      }

      let pdfBytes: Uint8Array;
      try {
        pdfBytes = buildPDF(form);
      } catch {
        throw new ToolError("TOOL_PROCESSING_FAILED");
      }

      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const firstName = form.nome.trim().split(" ")[0]?.toLowerCase() ?? "curriculo";
      const fileName = `curriculo-${firstName}.pdf`;

      return {
        files: [{ name: fileName, blob }],
        summary: `Currículo de ${form.nome} gerado com sucesso!`,
      };
    });
  }, [form, run]);

  // ── Reset everything ───────────────────────────────────────

  const handleReset = useCallback(() => {
    setForm(DEFAULT_FORM);
    setPreviewHTML(null);
    setStep("form");
    reset();
  }, [reset]);

  // ─────────────────────────────────────────────────────────────
  // Render: success
  // ─────────────────────────────────────────────────────────────

  if (state === "success" && result) {
    return (
      <div className="flex flex-col gap-4">
        <ResultPanel result={result} toolSlug="gerador-de-curriculo" onReset={handleReset} />
        <UsageMeter used={1} limit={anonLimit} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Render: processing
  // ─────────────────────────────────────────────────────────────

  if (state === "processing") {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Gerando currículo, aguarde…"
        className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface py-12"
      >
        <Spinner />
        <p className="text-sm text-muted">Gerando PDF…</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Render: preview step
  // ─────────────────────────────────────────────────────────────

  if (step === "preview" && previewHTML) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-base font-semibold text-fg">Pré-visualização do currículo</h2>
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={handleBackToForm}>
              Editar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerate}
              loading={false}
            >
              Baixar PDF
            </Button>
          </div>
        </div>

        {state === "error" && error && (
          <p role="alert" className="rounded-lg bg-danger-500/10 px-4 py-3 text-sm text-danger-700">
            {error}
          </p>
        )}

        {/* HTML preview rendered in a sandboxed iframe-like div */}
        <div
          className="overflow-auto rounded-xl border border-border bg-white p-4 shadow-sm"
          aria-label="Pré-visualização do currículo"
           
          dangerouslySetInnerHTML={{ __html: previewHTML }}
        />

        <UsageMeter used={0} limit={anonLimit} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Render: form step
  // ─────────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); handlePreview(); }}
      className="flex flex-col gap-8"
      aria-label="Formulário para geração de currículo"
      noValidate
    >
      {/* ── Dados pessoais ──────────────────────────────────── */}
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-base font-semibold text-fg">Dados Pessoais</legend>

        <Input
          id="cv-nome"
          label="Nome completo *"
          placeholder="Maria da Silva"
          value={form.nome}
          onChange={(e) => setField("nome", e.target.value)}
          required
          autoComplete="name"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="E-mail"
            type="email"
            placeholder="maria@email.com"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            autoComplete="email"
          />
          <Input
            label="Telefone"
            type="tel"
            placeholder="(11) 91234-5678"
            value={form.telefone}
            onChange={(e) => setField("telefone", e.target.value)}
            autoComplete="tel"
          />
          <Input
            label="Localização"
            placeholder="São Paulo, SP"
            value={form.localizacao}
            onChange={(e) => setField("localizacao", e.target.value)}
          />
          <Input
            label="LinkedIn"
            placeholder="linkedin.com/in/mariasilva"
            value={form.linkedin}
            onChange={(e) => setField("linkedin", e.target.value)}
          />
          <Input
            label="Site / Portfólio"
            placeholder="mariasilva.dev"
            value={form.site}
            onChange={(e) => setField("site", e.target.value)}
            className="sm:col-span-2"
          />
        </div>
      </fieldset>

      {/* ── Resumo profissional ─────────────────────────────── */}
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-base font-semibold text-fg">Resumo Profissional</legend>
        <TextAreaField
          label="Resumo"
          id={resumoId}
          value={form.resumo}
          onChange={(v) => setField("resumo", v)}
          placeholder="Profissional com X anos de experiência em… Descreva seus diferenciais em 2-4 frases."
          rows={4}
          hint="Escreva de 2 a 4 frases sobre seus principais diferenciais e objetivos."
        />
      </fieldset>

      {/* ── Experiências ────────────────────────────────────── */}
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-base font-semibold text-fg">Experiência Profissional</legend>

        {form.experiencias.map((exp, idx) => (
          <div
            key={exp.id}
            className="relative rounded-xl border border-border bg-surface p-4 flex flex-col gap-3"
            aria-label={`Experiência ${idx + 1}`}
          >
            {form.experiencias.length > 1 && (
              <button
                type="button"
                onClick={() => removeExp(exp.id)}
                aria-label={`Remover experiência ${idx + 1}`}
                className="absolute right-3 top-3 rounded p-1 text-muted hover:text-danger-500 transition-colors"
              >
                <Trash2 size={15} aria-hidden />
              </button>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Cargo"
                placeholder="Desenvolvedora Front-end"
                value={exp.cargo}
                onChange={(e) => setExp(exp.id, "cargo", e.target.value)}
              />
              <Input
                label="Empresa"
                placeholder="Tech Corp"
                value={exp.empresa}
                onChange={(e) => setExp(exp.id, "empresa", e.target.value)}
              />
              <Input
                label="Período"
                placeholder="Jan 2021 – Dez 2023"
                value={exp.periodo}
                onChange={(e) => setExp(exp.id, "periodo", e.target.value)}
                className="sm:col-span-2"
              />
            </div>

            <TextAreaField
              label="Descrição"
              id={`exp-desc-${exp.id}`}
              value={exp.descricao}
              onChange={(v) => setExp(exp.id, "descricao", v)}
              placeholder="Descreva suas principais responsabilidades e conquistas…"
              rows={3}
            />
          </div>
        ))}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<Plus size={15} aria-hidden />}
          onClick={addExp}
          className="w-fit"
        >
          Adicionar experiência
        </Button>
      </fieldset>

      {/* ── Formação ────────────────────────────────────────── */}
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-base font-semibold text-fg">Formação Acadêmica</legend>

        {form.formacoes.map((f, idx) => (
          <div
            key={f.id}
            className="relative rounded-xl border border-border bg-surface p-4 flex flex-col gap-3"
            aria-label={`Formação ${idx + 1}`}
          >
            {form.formacoes.length > 1 && (
              <button
                type="button"
                onClick={() => removeFormacao(f.id)}
                aria-label={`Remover formação ${idx + 1}`}
                className="absolute right-3 top-3 rounded p-1 text-muted hover:text-danger-500 transition-colors"
              >
                <Trash2 size={15} aria-hidden />
              </button>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Curso / Grau"
                placeholder="Bacharelado em Ciência da Computação"
                value={f.curso}
                onChange={(e) => setFormacao(f.id, "curso", e.target.value)}
                className="sm:col-span-2"
              />
              <Input
                label="Instituição"
                placeholder="Universidade de São Paulo"
                value={f.instituicao}
                onChange={(e) => setFormacao(f.id, "instituicao", e.target.value)}
              />
              <Input
                label="Período"
                placeholder="2018 – 2022"
                value={f.periodo}
                onChange={(e) => setFormacao(f.id, "periodo", e.target.value)}
              />
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<Plus size={15} aria-hidden />}
          onClick={addFormacao}
          className="w-fit"
        >
          Adicionar formação
        </Button>
      </fieldset>

      {/* ── Habilidades ─────────────────────────────────────── */}
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-base font-semibold text-fg">Habilidades</legend>
        <TextAreaField
          label="Habilidades"
          id={habilidadesId}
          value={form.habilidades}
          onChange={(v) => setField("habilidades", v)}
          placeholder="React, TypeScript, Node.js, Figma, Scrum, Inglês avançado…"
          rows={3}
          hint="Separe as habilidades por vírgulas, ponto-e-vírgulas ou em linhas separadas."
        />
      </fieldset>

      {/* ── Error banner ────────────────────────────────────── */}
      {state === "error" && error && (
        <p role="alert" className="rounded-lg bg-danger-500/10 px-4 py-3 text-sm text-danger-700">
          {error}
        </p>
      )}

      {/* ── Actions ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" size="lg">
          Pré-visualizar currículo
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={handleGenerate}
          loading={false}
        >
          Gerar PDF direto
        </Button>
      </div>

      {/* ── Usage meter ─────────────────────────────────────── */}
      <UsageMeter used={0} limit={anonLimit} />
    </form>
  );
}
