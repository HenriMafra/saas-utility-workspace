"use client";

import { useState, useId, useRef, useCallback } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { UsageMeter } from "@/components/ui/UsageMeter";
import { getTool } from "@/lib/tools/registry";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOOL_SLUG = "validador-gerador";
const tool = getTool(TOOL_SLUG)!;

type TabId = "validar" | "qrcode" | "gerar";

const TABS: { id: TabId; label: string }[] = [
  { id: "validar", label: "Validar CPF / CNPJ" },
  { id: "qrcode", label: "Gerar QR Code" },
  { id: "gerar", label: "Gerar CPF / CNPJ de Teste" },
];

// ---------------------------------------------------------------------------
// CPF helpers
// ---------------------------------------------------------------------------

function stripMask(v: string): string {
  return v.replace(/\D/g, "");
}

function isAllSameDigits(s: string): boolean {
  return s.split("").every((c) => c === s[0]);
}

function validateCPF(raw: string): { valid: boolean; message: string } {
  const d = stripMask(raw);
  if (d.length !== 11) return { valid: false, message: "CPF deve ter 11 dígitos." };
  if (isAllSameDigits(d)) return { valid: false, message: "CPF inválido (dígitos todos iguais)." };

  const calc = (digits: string, weights: number[]) =>
    digits
      .split("")
      .slice(0, weights.length)
      .reduce((sum, ch, i) => sum + parseInt(ch) * weights[i], 0);

  const mod11 = (n: number) => {
    const r = n % 11;
    return r < 2 ? 0 : 11 - r;
  };

  const w1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = mod11(calc(d, w1));
  const d2 = mod11(calc(d, w2));

  if (d1 !== parseInt(d[9]) || d2 !== parseInt(d[10])) {
    return { valid: false, message: "CPF inválido (dígitos verificadores incorretos)." };
  }
  return { valid: true, message: "CPF válido." };
}

// ---------------------------------------------------------------------------
// CNPJ helpers
// ---------------------------------------------------------------------------

function validateCNPJ(raw: string): { valid: boolean; message: string } {
  const d = stripMask(raw);
  if (d.length !== 14) return { valid: false, message: "CNPJ deve ter 14 dígitos." };
  if (isAllSameDigits(d)) return { valid: false, message: "CNPJ inválido (dígitos todos iguais)." };

  const calcCNPJ = (digits: string, length: number): number => {
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights = length === 12 ? weights1 : weights2;
    const sum = digits
      .split("")
      .slice(0, length)
      .reduce((acc, ch, i) => acc + parseInt(ch) * weights[i], 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };

  const d1 = calcCNPJ(d, 12);
  const d2 = calcCNPJ(d, 13);

  if (d1 !== parseInt(d[12]) || d2 !== parseInt(d[13])) {
    return { valid: false, message: "CNPJ inválido (dígitos verificadores incorretos)." };
  }
  return { valid: true, message: "CNPJ válido." };
}

// ---------------------------------------------------------------------------
// CPF/CNPJ format detection & unified validate
// ---------------------------------------------------------------------------

function detectAndValidate(raw: string): { valid: boolean; message: string; type: "CPF" | "CNPJ" | null } {
  const d = stripMask(raw);
  if (d.length === 11) {
    const r = validateCPF(d);
    return { ...r, type: "CPF" };
  }
  if (d.length === 14) {
    const r = validateCNPJ(d);
    return { ...r, type: "CNPJ" };
  }
  return { valid: false, message: "Digite um CPF (11 dígitos) ou CNPJ (14 dígitos).", type: null };
}

// ---------------------------------------------------------------------------
// CPF mask helper
// ---------------------------------------------------------------------------

function maskCPF(v: string): string {
  const d = stripMask(v).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function maskCNPJ(v: string): string {
  const d = stripMask(v).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function smartMask(v: string): string {
  const d = stripMask(v);
  if (d.length <= 11) return maskCPF(d);
  return maskCNPJ(d);
}

// ---------------------------------------------------------------------------
// CPF/CNPJ generators (for TEST purposes only)
// ---------------------------------------------------------------------------

function randomDigits(n: number): number[] {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 10));
}

function generateTestCPF(): string {
  const n = randomDigits(9);
  const mod11 = (sum: number) => {
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const w1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
  const sum1 = n.reduce((acc, v, i) => acc + v * w1[i], 0);
  const d1 = mod11(sum1);
  const allD = [...n, d1];
  const w2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
  const sum2 = allD.reduce((acc, v, i) => acc + v * w2[i], 0);
  const d2 = mod11(sum2);
  const full = [...allD, d2].join("");
  return `${full.slice(0, 3)}.${full.slice(3, 6)}.${full.slice(6, 9)}-${full.slice(9)}`;
}

function generateTestCNPJ(): string {
  const n = [...randomDigits(8), 0, 0, 0, 1]; // fixed branch 0001
  const calcCNPJ = (digits: number[], length: number): number => {
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights = length === 12 ? weights1 : weights2;
    const sum = digits.slice(0, length).reduce((acc, v, i) => acc + v * weights[i], 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = calcCNPJ(n, 12);
  const full = [...n, d1];
  const d2 = calcCNPJ(full, 13);
  const s = [...full, d2].join("");
  return `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5, 8)}/${s.slice(8, 12)}-${s.slice(12)}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// ---- Tab: Validar CPF / CNPJ ----

function TabValidar() {
  const inputId = useId();
  const [value, setValue] = useState("");
  const [result, setResult] = useState<{ valid: boolean; message: string; type: "CPF" | "CNPJ" | null } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = smartMask(e.target.value);
    setValue(masked);
    setResult(null);
  };

  const handleValidate = () => {
    const r = detectAndValidate(value);
    setResult(r);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleValidate();
  };

  const handleClear = () => {
    setValue("");
    setResult(null);
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        Digite um CPF (xxx.xxx.xxx-xx) ou CNPJ (xx.xxx.xxx/xxxx-xx) para validar os dígitos verificadores.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            id={inputId}
            label="CPF ou CNPJ"
            placeholder="000.000.000-00 ou 00.000.000/0000-00"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            inputMode="numeric"
            autoComplete="off"
            aria-label="Número de CPF ou CNPJ"
            error={result && !result.valid ? result.message : undefined}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleValidate}
            disabled={stripMask(value).length < 11}
            aria-label="Validar número informado"
          >
            Validar
          </Button>
          {value && (
            <Button variant="secondary" size="md" onClick={handleClear} aria-label="Limpar campo">
              Limpar
            </Button>
          )}
        </div>
      </div>

      {result && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "flex items-start gap-3 rounded-xl border px-5 py-4 text-sm font-medium",
            result.valid
              ? "border-success-500/30 bg-success-100/40 text-success-700 dark:bg-success-900/20 dark:text-success-400"
              : "border-danger-500/30 bg-danger-100/40 text-danger-700 dark:bg-danger-900/20 dark:text-danger-400",
          )}
        >
          <span aria-hidden className="mt-0.5 text-lg leading-none">
            {result.valid ? "✓" : "✗"}
          </span>
          <div>
            {result.type && (
              <p className="mb-0.5 text-xs font-normal text-muted">{result.type} informado</p>
            )}
            <p>{result.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Tab: Gerar QR Code ----

function TabQRCode() {
  const inputId = useId();
  const [text, setText] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState<256 | 512>(256);

  const generate = useCallback(async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setQrDataUrl(null);
    try {
      const dataUrl = await QRCode.toDataURL(text.trim(), {
        width: size,
        margin: 2,
        errorCorrectionLevel: "M",
      });
      setQrDataUrl(dataUrl);
    } catch {
      setError("Não foi possível gerar o QR Code. Verifique o conteúdo digitado.");
    } finally {
      setLoading(false);
    }
  }, [text, size]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") void generate();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "qrcode.png";
    a.click();
  };

  const handleReset = () => {
    setText("");
    setQrDataUrl(null);
    setError(null);
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        Insira uma URL, texto ou qualquer dado para gerar um QR Code em PNG. Processado no seu navegador.
      </p>

      <Input
        id={inputId}
        label="Conteúdo do QR Code"
        placeholder="https://exemplo.com.br ou qualquer texto"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setQrDataUrl(null);
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        hint="URLs, textos, e-mails, números de telefone, Pix, etc."
      />

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-fg">Tamanho</legend>
        <div className="flex gap-3">
          {([256, 512] as const).map((s) => (
            <label
              key={s}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors",
                size === s
                  ? "border-brand-500 bg-brand-50 font-semibold text-brand-600 dark:bg-brand-900/20"
                  : "border-border bg-surface text-fg hover:border-brand-400",
              )}
            >
              <input
                type="radio"
                name="qr-size"
                value={s}
                checked={size === s}
                onChange={() => {
                  setSize(s);
                  setQrDataUrl(null);
                }}
                className="sr-only"
              />
              {s}×{s} px
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-2">
        <Button
          variant="primary"
          size="md"
          onClick={() => void generate()}
          disabled={!text.trim() || loading}
          loading={loading}
          aria-label="Gerar QR Code"
        >
          Gerar QR Code
        </Button>
        {qrDataUrl && (
          <Button variant="secondary" size="md" onClick={handleReset} aria-label="Reiniciar gerador">
            Reiniciar
          </Button>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-danger-500/30 bg-danger-100/40 px-4 py-3 text-sm text-danger-700">
          {error}
        </div>
      )}

      {loading && (
        <div role="status" aria-live="polite" className="flex items-center gap-3 text-sm text-muted">
          <Spinner className="h-5 w-5" />
          <span>Gerando QR Code…</span>
        </div>
      )}

      {qrDataUrl && !loading && (
        <div className="flex flex-col items-center gap-5 rounded-xl border border-border bg-surface p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt={`QR Code para: ${text}`}
            width={size}
            height={size}
            className="rounded-lg border border-border"
            style={{ maxWidth: "100%", height: "auto" }}
          />
          <Button
            variant="primary"
            size="md"
            onClick={handleDownload}
            aria-label="Baixar QR Code como imagem PNG"
          >
            Baixar PNG
          </Button>
          <p className="text-xs text-muted">Imagem gerada no seu navegador — nenhum dado é enviado.</p>
        </div>
      )}
    </div>
  );
}

// ---- Tab: Gerar CPF/CNPJ de Teste ----

type GeneratorMode = "cpf" | "cnpj";

interface GeneratedItem {
  value: string;
  type: "CPF" | "CNPJ";
}

function TabGerar() {
  const modeId = useId();
  const [mode, setMode] = useState<GeneratorMode>("cpf");
  const [count, setCount] = useState(1);
  const [items, setItems] = useState<GeneratedItem[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleGenerate = () => {
    const generated: GeneratedItem[] = [];
    const n = Math.min(Math.max(1, count), 20);
    for (let i = 0; i < n; i++) {
      generated.push({
        value: mode === "cpf" ? generateTestCPF() : generateTestCNPJ(),
        type: mode === "cpf" ? "CPF" : "CNPJ",
      });
    }
    setItems(generated);
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      setCopied(value);
      copiedTimer.current = setTimeout(() => setCopied(null), 2000);
    } catch {
      // clipboard not available — do nothing silently
    }
  };

  const handleCopyAll = async () => {
    const text = items.map((i) => i.value).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      setCopied("__all__");
      copiedTimer.current = setTimeout(() => setCopied(null), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <div className="space-y-5">
      {/* Warning banner */}
      <div
        role="note"
        aria-label="Aviso importante sobre uso de dados fictícios"
        className="flex gap-3 rounded-xl border border-warning-500/50 bg-warning-100/50 px-5 py-4 dark:bg-warning-900/20"
      >
        <span aria-hidden className="mt-0.5 text-xl leading-none">
          ⚠️
        </span>
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-warning-700 dark:text-warning-400">
            Apenas para testes de software.
          </p>
          <p className="text-warning-700 dark:text-warning-400">
            Os números gerados são matematicamente válidos, mas <strong>fictícios</strong>. Usá-los
            para fraudar cadastros, contratos, benefícios ou qualquer ato jurídico é{" "}
            <strong>crime</strong> (art. 299 do Código Penal – falsidade ideológica).
          </p>
        </div>
      </div>

      {/* Mode selector */}
      <fieldset>
        <legend id={`${modeId}-legend`} className="mb-2 text-sm font-medium text-fg">
          Tipo de documento
        </legend>
        <div role="radiogroup" aria-labelledby={`${modeId}-legend`} className="flex gap-3">
          {(["cpf", "cnpj"] as GeneratorMode[]).map((m) => (
            <label
              key={m}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                mode === m
                  ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-900/20"
                  : "border-border bg-surface text-fg hover:border-brand-400",
              )}
            >
              <input
                type="radio"
                name={`${modeId}-mode`}
                value={m}
                checked={mode === m}
                onChange={() => {
                  setMode(m);
                  setItems([]);
                }}
                className="sr-only"
              />
              {m.toUpperCase()}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Quantity */}
      <div className="flex items-end gap-3">
        <div className="w-40">
          <Input
            label="Quantidade (1–20)"
            type="number"
            min={1}
            max={20}
            value={count}
            onChange={(e) => setCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
            aria-label="Quantidade de números a gerar"
          />
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={handleGenerate}
          aria-label={`Gerar ${count} ${mode.toUpperCase()} de teste`}
        >
          Gerar
        </Button>
      </div>

      {/* Results */}
      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-fg">
              {items.length} {items[0].type}{items.length > 1 ? "s" : ""} gerado{items.length > 1 ? "s" : ""}
            </p>
            {items.length > 1 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void handleCopyAll()}
                aria-label="Copiar todos os números gerados"
              >
                {copied === "__all__" ? "Copiado!" : "Copiar todos"}
              </Button>
            )}
          </div>
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface" role="list">
            {items.map((item, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <code className="font-mono text-sm text-fg">{item.value}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleCopy(item.value)}
                  aria-label={`Copiar ${item.type} ${item.value}`}
                >
                  {copied === item.value ? "Copiado!" : "Copiar"}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main runner component
// ---------------------------------------------------------------------------

export default function ValidadorGeradorRunner() {
  const [activeTab, setActiveTab] = useState<TabId>("validar");
  const tablistId = useId();

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div
        role="tablist"
        aria-label="Funcionalidades do validador e gerador"
        id={tablistId}
        className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-controls={`panel-${tab.id}`}
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              activeTab === tab.id
                ? "bg-brand-500 text-white shadow-sm"
                : "text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {TABS.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          tabIndex={0}
          className="rounded-xl border border-border bg-surface p-6 focus-visible:outline-none"
        >
          {tab.id === "validar" && activeTab === "validar" && <TabValidar />}
          {tab.id === "qrcode" && activeTab === "qrcode" && <TabQRCode />}
          {tab.id === "gerar" && activeTab === "gerar" && <TabGerar />}
        </div>
      ))}

      {/* Usage meter */}
      <UsageMeter used={0} limit={tool.limits.anonPerDay} />

      <p className="text-center text-xs text-muted">
        Toda a computação acontece no seu navegador — nenhum dado é enviado para nossos servidores.
      </p>
    </div>
  );
}
