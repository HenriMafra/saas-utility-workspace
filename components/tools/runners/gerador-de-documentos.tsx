"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { jsPDF } from "jspdf";
import { ResultPanel } from "@/components/ui/ResultPanel";
import { UsageMeter } from "@/components/ui/UsageMeter";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getTool } from "@/lib/tools/registry";
import { useToolRun } from "@/hooks/useToolRun";
import { ToolError } from "@/lib/tools/process-types";
import { formatDateBR } from "@/lib/utils";

// ─── Document type ───────────────────────────────────────────────────────────

type DocType = "contrato" | "recibo" | "declaracao";

const DOC_LABELS: Record<DocType, string> = {
  contrato: "Contrato de Prestação de Serviços",
  recibo: "Recibo de Pagamento",
  declaracao: "Declaração",
};

// ─── Form schemas per document type ──────────────────────────────────────────

interface ContratoFields {
  prestadorNome: string;
  prestadorCpfCnpj: string;
  prestadorEndereco: string;
  contratanteNome: string;
  contratanteCpfCnpj: string;
  contratanteEndereco: string;
  descricaoServico: string;
  valorTotal: string;
  prazoEntrega: string;
  formaPagamento: string;
  cidade: string;
  dataContrato: string;
}

interface ReciboFields {
  pagadorNome: string;
  pagadorCpfCnpj: string;
  recebedorNome: string;
  recebedorCpfCnpj: string;
  descricao: string;
  valor: string;
  formaPagamento: string;
  cidade: string;
  dataRecibo: string;
}

interface DeclaracaoFields {
  declaranteNome: string;
  declaranteCpfCnpj: string;
  conteudo: string;
  finalidade: string;
  cidade: string;
  dataDeclaracao: string;
}

type AnyFields = ContratoFields | ReciboFields | DeclaracaoFields;

// ─── PDF helpers ──────────────────────────────────────────────────────────────

const DISCLAIMER =
  "ATENÇÃO: Este é um modelo informativo e não substitui orientação jurídica profissional. Revise o documento com cuidado antes de utilizá-lo.";

const PAGE_MARGIN = 20;
const LINE_HEIGHT = 7;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function addHeader(doc: jsPDF, title: string): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, PAGE_WIDTH / 2, 25, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const y = 38;
  doc.setDrawColor(180, 180, 180);
  doc.line(PAGE_MARGIN, y, PAGE_WIDTH - PAGE_MARGIN, y);
  return y + 8;
}

function addSection(doc: jsPDF, title: string, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(title, PAGE_MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  return y + LINE_HEIGHT;
}

function addField(doc: jsPDF, label: string, value: string, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(label.toUpperCase(), PAGE_MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  const next = addWrappedText(doc, value || "—", PAGE_MARGIN, y + 4.5, CONTENT_WIDTH, LINE_HEIGHT);
  return next + 3;
}

function addDisclaimer(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(220, 180, 50);
    doc.setLineWidth(0.4);
    doc.line(PAGE_MARGIN, pageHeight - 22, PAGE_WIDTH - PAGE_MARGIN, pageHeight - 22);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(140, 100, 0);
    const lines = doc.splitTextToSize(DISCLAIMER, CONTENT_WIDTH) as string[];
    doc.text(lines, PAGE_WIDTH / 2, pageHeight - 17, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(`Página ${i} de ${pageCount}`, PAGE_WIDTH / 2, pageHeight - 8, { align: "center" });
  }
}

function ensureSpace(doc: jsPDF, y: number, needed = 20): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - 30) {
    doc.addPage();
    return PAGE_MARGIN + 10;
  }
  return y;
}

// ─── PDF generators ───────────────────────────────────────────────────────────

function generateContratoPDF(fields: ContratoFields): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = addHeader(doc, "CONTRATO DE PRESTAÇÃO DE SERVIÇOS");

  y = addSection(doc, "1. DAS PARTES", y);
  y = addField(doc, "Prestador de Serviços", fields.prestadorNome, y);
  y = addField(doc, "CPF/CNPJ do Prestador", fields.prestadorCpfCnpj, y);
  y = addField(doc, "Endereço do Prestador", fields.prestadorEndereco, y);
  y += 3;
  y = addField(doc, "Contratante", fields.contratanteNome, y);
  y = addField(doc, "CPF/CNPJ do Contratante", fields.contratanteCpfCnpj, y);
  y = addField(doc, "Endereço do Contratante", fields.contratanteEndereco, y);
  y += 5;

  y = ensureSpace(doc, y, 40);
  y = addSection(doc, "2. DO OBJETO", y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  y = addWrappedText(
    doc,
    `O PRESTADOR obriga-se a executar os seguintes serviços para o CONTRATANTE:`,
    PAGE_MARGIN,
    y,
    CONTENT_WIDTH,
    LINE_HEIGHT,
  );
  y += 2;
  y = addWrappedText(doc, fields.descricaoServico, PAGE_MARGIN + 5, y, CONTENT_WIDTH - 5, LINE_HEIGHT);
  y += 5;

  y = ensureSpace(doc, y, 30);
  y = addSection(doc, "3. DO VALOR E PAGAMENTO", y);
  y = addField(doc, "Valor Total", `R$ ${fields.valorTotal}`, y);
  y = addField(doc, "Forma de Pagamento", fields.formaPagamento, y);
  y += 5;

  y = ensureSpace(doc, y, 20);
  y = addSection(doc, "4. DO PRAZO", y);
  y = addField(doc, "Prazo / Data de Entrega", fields.prazoEntrega, y);
  y += 5;

  y = ensureSpace(doc, y, 40);
  y = addSection(doc, "5. DAS DISPOSIÇÕES GERAIS", y);
  const clausulas = [
    "5.1 O presente contrato é celebrado em caráter irrevogável e irretratável.",
    "5.2 Qualquer alteração deste contrato somente terá validade se realizada por escrito e assinada por ambas as partes.",
    "5.3 Fica eleito o foro da comarca de " +
      (fields.cidade || "_______________") +
      " para dirimir quaisquer controvérsias oriundas deste contrato.",
  ];
  for (const c of clausulas) {
    y = ensureSpace(doc, y, 12);
    y = addWrappedText(doc, c, PAGE_MARGIN, y, CONTENT_WIDTH, LINE_HEIGHT);
    y += 2;
  }
  y += 8;

  y = ensureSpace(doc, y, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  const dataFormatada = fields.dataContrato ? formatDateBR(fields.dataContrato) : "___/___/______";
  doc.text(`${fields.cidade || "_______________"}, ${dataFormatada}`, PAGE_MARGIN, y);
  y += 18;

  y = ensureSpace(doc, y, 40);
  doc.setDrawColor(60, 60, 60);
  doc.line(PAGE_MARGIN, y, PAGE_MARGIN + 70, y);
  doc.line(PAGE_WIDTH - PAGE_MARGIN - 70, y, PAGE_WIDTH - PAGE_MARGIN, y);
  y += 4;
  doc.setFontSize(9);
  doc.text(fields.prestadorNome || "Prestador", PAGE_MARGIN, y);
  doc.text(fields.contratanteNome || "Contratante", PAGE_WIDTH - PAGE_MARGIN, y, { align: "right" });

  addDisclaimer(doc);
  return doc.output("arraybuffer") as unknown as Uint8Array;
}

function generateReciboPDF(fields: ReciboFields): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = addHeader(doc, "RECIBO DE PAGAMENTO");

  y = addSection(doc, "DADOS DO RECEBIMENTO", y);
  y = addField(doc, "Recebi de", fields.pagadorNome, y);
  y = addField(doc, "CPF/CNPJ do Pagador", fields.pagadorCpfCnpj, y);
  y += 3;
  y = addField(doc, "A quantia de (R$)", fields.valor, y);
  y = addField(doc, "Forma de Pagamento", fields.formaPagamento, y);
  y += 3;
  y = addField(doc, "Referente a", fields.descricao, y);
  y += 8;

  y = ensureSpace(doc, y, 30);
  y = addSection(doc, "DADOS DO RECEBEDOR", y);
  y = addField(doc, "Nome do Recebedor", fields.recebedorNome, y);
  y = addField(doc, "CPF/CNPJ do Recebedor", fields.recebedorCpfCnpj, y);
  y += 8;

  y = ensureSpace(doc, y, 50);
  const dataFormatada = fields.dataRecibo ? formatDateBR(fields.dataRecibo) : "___/___/______";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text(`${fields.cidade || "_______________"}, ${dataFormatada}`, PAGE_MARGIN, y);
  y += 20;

  y = ensureSpace(doc, y, 30);
  doc.setDrawColor(60, 60, 60);
  doc.line(PAGE_MARGIN + 20, y, PAGE_MARGIN + 90, y);
  y += 4;
  doc.setFontSize(9);
  doc.text(fields.recebedorNome || "Recebedor", PAGE_MARGIN + 55, y, { align: "center" });

  addDisclaimer(doc);
  return doc.output("arraybuffer") as unknown as Uint8Array;
}

function generateDeclaracaoPDF(fields: DeclaracaoFields): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = addHeader(doc, "DECLARAÇÃO");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);

  const intro = `Eu, ${fields.declaranteNome || "_______________"}, portador(a) do CPF/CNPJ nº ${fields.declaranteCpfCnpj || "_______________"}, declaro, para os devidos fins${fields.finalidade ? " de " + fields.finalidade : ""}, que:`;

  y = addWrappedText(doc, intro, PAGE_MARGIN, y, CONTENT_WIDTH, LINE_HEIGHT);
  y += 8;

  y = ensureSpace(doc, y, 20);
  y = addWrappedText(doc, fields.conteudo, PAGE_MARGIN + 5, y, CONTENT_WIDTH - 5, LINE_HEIGHT);
  y += 8;

  y = ensureSpace(doc, y, 30);
  y = addWrappedText(
    doc,
    "Por ser verdade, firmo a presente declaração.",
    PAGE_MARGIN,
    y,
    CONTENT_WIDTH,
    LINE_HEIGHT,
  );
  y += 14;

  y = ensureSpace(doc, y, 40);
  const dataFormatada = fields.dataDeclaracao
    ? formatDateBR(fields.dataDeclaracao)
    : "___/___/______";
  doc.text(`${fields.cidade || "_______________"}, ${dataFormatada}`, PAGE_MARGIN, y);
  y += 20;

  y = ensureSpace(doc, y, 25);
  doc.setDrawColor(60, 60, 60);
  doc.line(PAGE_MARGIN + 20, y, PAGE_MARGIN + 90, y);
  y += 4;
  doc.setFontSize(9);
  doc.text(fields.declaranteNome || "Declarante", PAGE_MARGIN + 55, y, { align: "center" });

  addDisclaimer(doc);
  return doc.output("arraybuffer") as unknown as Uint8Array;
}

// ─── Sub-forms ────────────────────────────────────────────────────────────────

function ContratoForm({
  onGenerate,
  loading,
}: {
  onGenerate: (fields: ContratoFields) => void;
  loading: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContratoFields>({
    defaultValues: { dataContrato: new Date().toISOString().slice(0, 10) },
  });

  return (
    <form
      onSubmit={handleSubmit(onGenerate)}
      aria-label="Formulário de contrato de prestação de serviços"
      className="flex flex-col gap-4"
      noValidate
    >
      <fieldset className="rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold text-fg">Prestador de Serviços</legend>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Nome completo / Razão social *"
            {...register("prestadorNome", { required: "Informe o nome do prestador" })}
            error={errors.prestadorNome?.message}
            autoComplete="name"
          />
          <Input
            label="CPF ou CNPJ *"
            {...register("prestadorCpfCnpj", { required: "Informe o CPF/CNPJ do prestador" })}
            error={errors.prestadorCpfCnpj?.message}
            placeholder="000.000.000-00"
          />
          <div className="sm:col-span-2">
            <Input
              label="Endereço completo"
              {...register("prestadorEndereco")}
              placeholder="Rua, nº, bairro, cidade - UF"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold text-fg">Contratante</legend>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Nome completo / Razão social *"
            {...register("contratanteNome", { required: "Informe o nome do contratante" })}
            error={errors.contratanteNome?.message}
          />
          <Input
            label="CPF ou CNPJ *"
            {...register("contratanteCpfCnpj", { required: "Informe o CPF/CNPJ do contratante" })}
            error={errors.contratanteCpfCnpj?.message}
            placeholder="000.000.000-00"
          />
          <div className="sm:col-span-2">
            <Input
              label="Endereço completo"
              {...register("contratanteEndereco")}
              placeholder="Rua, nº, bairro, cidade - UF"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold text-fg">Serviço e Pagamento</legend>
        <div className="mt-3 flex flex-col gap-3">
          <div>
            <label
              htmlFor="descricaoServico"
              className="mb-1 block text-sm font-medium text-fg"
            >
              Descrição do serviço *
            </label>
            <textarea
              id="descricaoServico"
              rows={3}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Descreva os serviços a serem prestados…"
              aria-required="true"
              {...register("descricaoServico", { required: "Descreva o serviço" })}
            />
            {errors.descricaoServico && (
              <p role="alert" className="mt-1 text-xs text-danger-700">
                {errors.descricaoServico.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Valor total (R$) *"
              type="text"
              inputMode="decimal"
              {...register("valorTotal", { required: "Informe o valor" })}
              error={errors.valorTotal?.message}
              placeholder="0,00"
            />
            <Input
              label="Forma de pagamento *"
              {...register("formaPagamento", { required: "Informe a forma de pagamento" })}
              error={errors.formaPagamento?.message}
              placeholder="Ex.: PIX, transferência, boleto"
            />
            <Input
              label="Prazo / Data de entrega"
              {...register("prazoEntrega")}
              placeholder="Ex.: 30 dias ou dd/mm/aaaa"
            />
          </div>
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Cidade *"
          {...register("cidade", { required: "Informe a cidade" })}
          error={errors.cidade?.message}
          placeholder="São Paulo"
        />
        <Input
          label="Data do contrato *"
          type="date"
          {...register("dataContrato", { required: "Informe a data" })}
          error={errors.dataContrato?.message}
        />
      </div>

      <Button type="submit" loading={loading} size="md">
        Gerar contrato em PDF
      </Button>
    </form>
  );
}

function ReciboForm({
  onGenerate,
  loading,
}: {
  onGenerate: (fields: ReciboFields) => void;
  loading: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReciboFields>({
    defaultValues: { dataRecibo: new Date().toISOString().slice(0, 10) },
  });

  return (
    <form
      onSubmit={handleSubmit(onGenerate)}
      aria-label="Formulário de recibo de pagamento"
      className="flex flex-col gap-4"
      noValidate
    >
      <fieldset className="rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold text-fg">Quem pagou</legend>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Nome completo / Razão social *"
            {...register("pagadorNome", { required: "Informe o nome do pagador" })}
            error={errors.pagadorNome?.message}
          />
          <Input
            label="CPF ou CNPJ"
            {...register("pagadorCpfCnpj")}
            placeholder="000.000.000-00"
          />
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold text-fg">Quem recebeu</legend>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Nome completo / Razão social *"
            {...register("recebedorNome", { required: "Informe o nome do recebedor" })}
            error={errors.recebedorNome?.message}
          />
          <Input
            label="CPF ou CNPJ"
            {...register("recebedorCpfCnpj")}
            placeholder="000.000.000-00"
          />
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold text-fg">Pagamento</legend>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Valor recebido (R$) *"
            type="text"
            inputMode="decimal"
            {...register("valor", { required: "Informe o valor" })}
            error={errors.valor?.message}
            placeholder="0,00"
          />
          <Input
            label="Forma de pagamento"
            {...register("formaPagamento")}
            placeholder="Ex.: PIX, dinheiro, cartão"
          />
          <div className="sm:col-span-2">
            <Input
              label="Referente a *"
              {...register("descricao", { required: "Descreva o que foi pago" })}
              error={errors.descricao?.message}
              placeholder="Serviços de design, consultoria, aluguel…"
            />
          </div>
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Cidade *"
          {...register("cidade", { required: "Informe a cidade" })}
          error={errors.cidade?.message}
          placeholder="São Paulo"
        />
        <Input
          label="Data do recibo *"
          type="date"
          {...register("dataRecibo", { required: "Informe a data" })}
          error={errors.dataRecibo?.message}
        />
      </div>

      <Button type="submit" loading={loading} size="md">
        Gerar recibo em PDF
      </Button>
    </form>
  );
}

function DeclaracaoForm({
  onGenerate,
  loading,
}: {
  onGenerate: (fields: DeclaracaoFields) => void;
  loading: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeclaracaoFields>({
    defaultValues: { dataDeclaracao: new Date().toISOString().slice(0, 10) },
  });

  return (
    <form
      onSubmit={handleSubmit(onGenerate)}
      aria-label="Formulário de declaração"
      className="flex flex-col gap-4"
      noValidate
    >
      <fieldset className="rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold text-fg">Declarante</legend>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Nome completo *"
            {...register("declaranteNome", { required: "Informe o nome do declarante" })}
            error={errors.declaranteNome?.message}
          />
          <Input
            label="CPF ou CNPJ *"
            {...register("declaranteCpfCnpj", { required: "Informe o CPF/CNPJ" })}
            error={errors.declaranteCpfCnpj?.message}
            placeholder="000.000.000-00"
          />
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold text-fg">Conteúdo</legend>
        <div className="mt-3 flex flex-col gap-3">
          <Input
            label="Finalidade (opcional)"
            {...register("finalidade")}
            placeholder="Ex.: fins cadastrais, comprovação de renda…"
          />
          <div>
            <label htmlFor="conteudo" className="mb-1 block text-sm font-medium text-fg">
              Texto da declaração *
            </label>
            <textarea
              id="conteudo"
              rows={4}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Escreva aqui o conteúdo da sua declaração…"
              aria-required="true"
              {...register("conteudo", { required: "Escreva o conteúdo da declaração" })}
            />
            {errors.conteudo && (
              <p role="alert" className="mt-1 text-xs text-danger-700">
                {errors.conteudo.message}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Cidade *"
          {...register("cidade", { required: "Informe a cidade" })}
          error={errors.cidade?.message}
          placeholder="São Paulo"
        />
        <Input
          label="Data da declaração *"
          type="date"
          {...register("dataDeclaracao", { required: "Informe a data" })}
          error={errors.dataDeclaracao?.message}
        />
      </div>

      <Button type="submit" loading={loading} size="md">
        Gerar declaração em PDF
      </Button>
    </form>
  );
}

// ─── Main runner ──────────────────────────────────────────────────────────────

export default function GeradorDeDocumentosRunner() {
  const SLUG = "gerador-de-documentos";
  const tool = getTool(SLUG);
  const { state, result, error, run, reset } = useToolRun(SLUG);
  const [docType, setDocType] = useState<DocType>("contrato");

  if (!tool) return null;

  const isLoading = state === "processing";

  function handleReset() {
    reset();
  }

  async function handleContrato(fields: ContratoFields) {
    if (!fields.prestadorNome.trim() || !fields.contratanteNome.trim()) {
      throw new ToolError("VALIDATION");
    }
    await run(async () => {
      const bytes = generateContratoPDF(fields);
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      return {
        files: [{ name: "contrato-prestacao-servicos.pdf", blob }],
        summary: `Contrato gerado — ${fields.prestadorNome} × ${fields.contratanteNome}`,
      };
    });
  }

  async function handleRecibo(fields: ReciboFields) {
    if (!fields.pagadorNome.trim() || !fields.recebedorNome.trim()) {
      throw new ToolError("VALIDATION");
    }
    await run(async () => {
      const bytes = generateReciboPDF(fields);
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      return {
        files: [{ name: "recibo-pagamento.pdf", blob }],
        summary: `Recibo gerado — R$ ${fields.valor} de ${fields.pagadorNome}`,
      };
    });
  }

  async function handleDeclaracao(fields: DeclaracaoFields) {
    if (!fields.declaranteNome.trim()) {
      throw new ToolError("VALIDATION");
    }
    await run(async () => {
      const bytes = generateDeclaracaoPDF(fields);
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      return {
        files: [{ name: "declaracao.pdf", blob }],
        summary: `Declaração gerada — ${fields.declaranteNome}`,
      };
    });
  }

  return (
    <section aria-label="Gerador de documentos" className="flex flex-col gap-6">
      {/* Disclaimer */}
      <div
        role="note"
        aria-label="Aviso legal"
        className="rounded-xl border border-warning-500/40 bg-warning-100/50 px-4 py-3 dark:bg-warning-900/20"
      >
        <p className="text-sm text-warning-700 dark:text-warning-400">
          <strong>Modelo informativo</strong> — não substitui orientação jurídica profissional.
          Revise o documento com cuidado antes de utilizá-lo.
        </p>
      </div>

      {/* Document type selector */}
      {state === "idle" && (
        <fieldset className="rounded-xl border border-border bg-surface p-4">
          <legend className="mb-3 text-sm font-medium text-fg">Tipo de documento</legend>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            {(["contrato", "recibo", "declaracao"] as DocType[]).map((type) => (
              <label
                key={type}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-bg px-4 py-3 transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 dark:has-[:checked]:bg-brand-900/20"
              >
                <input
                  type="radio"
                  name="gerador-doc-type"
                  value={type}
                  checked={docType === type}
                  onChange={() => setDocType(type)}
                  className="accent-brand-500"
                />
                <span className="text-sm font-medium text-fg">{DOC_LABELS[type]}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Forms — only shown when idle */}
      {state === "idle" && docType === "contrato" && (
        <ContratoForm onGenerate={handleContrato} loading={isLoading} />
      )}
      {state === "idle" && docType === "recibo" && (
        <ReciboForm onGenerate={handleRecibo} loading={isLoading} />
      )}
      {state === "idle" && docType === "declaracao" && (
        <DeclaracaoForm onGenerate={handleDeclaracao} loading={isLoading} />
      )}

      {/* Processing state */}
      {state === "processing" && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface py-12 text-center"
        >
          <Spinner className="h-8 w-8" />
          <p className="text-sm font-medium text-fg">Gerando {DOC_LABELS[docType].toLowerCase()}…</p>
          <p className="text-xs text-muted">Processado no seu navegador — nenhum dado é enviado.</p>
        </div>
      )}

      {/* Error state */}
      {state === "error" && error && (
        <div className="rounded-xl border border-danger-500/30 bg-danger-100/40 p-5">
          <p role="alert" className="text-sm font-medium text-danger-700">
            {error}
          </p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={handleReset}>
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Success state */}
      {state === "success" && result && (
        <>
          <ResultPanel result={result} toolSlug={SLUG} onReset={handleReset} />
          <div
            role="note"
            aria-label="Lembrete legal"
            className="rounded-xl border border-warning-500/40 bg-warning-100/50 px-4 py-3 dark:bg-warning-900/20"
          >
            <p className="text-sm text-warning-700 dark:text-warning-400">
              O documento gerado é um <strong>modelo informativo</strong>. Não substitui orientação
              jurídica. Revise-o antes de usar.
            </p>
          </div>
        </>
      )}

      {/* Usage meter */}
      {(state === "idle" || state === "success") && (
        <UsageMeter used={0} limit={tool.limits.anonPerDay} />
      )}
    </section>
  );
}
