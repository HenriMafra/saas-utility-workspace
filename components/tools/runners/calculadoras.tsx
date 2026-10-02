"use client";

import * as React from "react";
import { getTool } from "@/lib/tools/registry";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

// ─── Tipos locais ─────────────────────────────────────────────────────────────

type TabId = "porcentagem" | "regra-de-tres" | "imc" | "conversor" | "dias";

interface Tab {
  id: TabId;
  label: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const TABS: Tab[] = [
  { id: "porcentagem", label: "Porcentagem" },
  { id: "regra-de-tres", label: "Regra de 3" },
  { id: "imc", label: "IMC" },
  { id: "conversor", label: "Conversor" },
  { id: "dias", label: "Dias entre datas" },
];

const tool = getTool("calculadoras");
const LIMIT = tool?.limits.anonPerDay ?? 9999;

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Runner() {
  const [activeTab, setActiveTab] = React.useState<TabId>("porcentagem");

  return (
    <div>
      {/* Abas */}
      <div
        role="tablist"
        aria-label="Calculadoras disponíveis"
        className="flex flex-wrap gap-2 border-b border-border pb-3"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              activeTab === tab.id
                ? "bg-brand-500 text-white"
                : "bg-surface text-muted hover:text-fg border border-border",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Painéis */}
      <div className="mt-6">
        <TabPanel id="porcentagem" active={activeTab === "porcentagem"}>
          <CalcPorcentagem />
        </TabPanel>
        <TabPanel id="regra-de-tres" active={activeTab === "regra-de-tres"}>
          <CalcRegraDeTres />
        </TabPanel>
        <TabPanel id="imc" active={activeTab === "imc"}>
          <CalcIMC />
        </TabPanel>
        <TabPanel id="conversor" active={activeTab === "conversor"}>
          <CalcConversor />
        </TabPanel>
        <TabPanel id="dias" active={activeTab === "dias"}>
          <CalcDias />
        </TabPanel>
      </div>

      {/* Uso anônimo visual */}
      <p className="mt-8 text-xs text-muted">
        Uso anônimo: ilimitado (limite diário:{" "}
        {LIMIT >= 9000 ? "sem limite" : LIMIT} usos)
      </p>
    </div>
  );
}

// ─── Wrapper de painel de aba ─────────────────────────────────────────────────

function TabPanel({
  id,
  active,
  children,
}: {
  id: TabId;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      hidden={!active}
    >
      {children}
    </div>
  );
}

// ─── Bloco de resultado ───────────────────────────────────────────────────────

function ResultBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-4 rounded-lg border border-success-500 bg-success-500/10 px-5 py-4 text-fg"
    >
      {children}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mt-4 rounded-lg border border-danger-500 bg-danger-500/10 px-5 py-4 text-danger-700 dark:text-danger-500 text-sm"
    >
      {message}
    </div>
  );
}

// ─── 1. Calculadora de Porcentagem ────────────────────────────────────────────

type PctMode = "quanto-e" | "de-total" | "variacao";

function CalcPorcentagem() {
  const [mode, setMode] = React.useState<PctMode>("quanto-e");
  const [a, setA] = React.useState("");
  const [b, setB] = React.useState("");
  const [result, setResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function reset() {
    setResult(null);
    setError(null);
  }

  function calcular() {
    setError(null);
    setResult(null);
    const na = parseFloat(a.replace(",", "."));
    const nb = parseFloat(b.replace(",", "."));
    if (isNaN(na) || isNaN(nb)) {
      setError("Preencha os dois campos com números válidos.");
      return;
    }
    if (mode === "quanto-e") {
      // Quanto é X% de Y?
      setResult(`${fmt(na)}% de ${fmt(nb)} = ${fmt((na / 100) * nb)}`);
    } else if (mode === "de-total") {
      // X é qual porcentagem de Y?
      if (nb === 0) { setError("O total não pode ser zero."); return; }
      setResult(`${fmt(na)} é ${fmt((na / nb) * 100)}% de ${fmt(nb)}`);
    } else {
      // Variação percentual de X para Y
      if (na === 0) { setError("O valor inicial não pode ser zero."); return; }
      const pct = ((nb - na) / Math.abs(na)) * 100;
      const sinal = pct >= 0 ? "aumento" : "redução";
      setResult(
        `De ${fmt(na)} para ${fmt(nb)}: ${sinal} de ${fmt(Math.abs(pct))}%`,
      );
    }
  }

  const modos: { id: PctMode; label: string; labelA: string; labelB: string }[] = [
    { id: "quanto-e", label: "Quanto é X% de Y?", labelA: "Porcentagem (%)", labelB: "Total" },
    { id: "de-total", label: "X é qual % de Y?", labelA: "Valor", labelB: "Total" },
    { id: "variacao", label: "Variação percentual", labelA: "Valor inicial", labelB: "Valor final" },
  ];

  const current = modos.find((m) => m.id === mode)!;

  return (
    <Card className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-fg">Tipo de cálculo</legend>
        <div className="flex flex-wrap gap-2">
          {modos.map((m) => (
            <label key={m.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="pct-mode"
                value={m.id}
                checked={mode === m.id}
                onChange={() => { setMode(m.id); reset(); }}
                className="accent-brand-500"
              />
              {m.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label={current.labelA}
          id="pct-a"
          type="text"
          inputMode="decimal"
          value={a}
          onChange={(e) => { setA(e.target.value); reset(); }}
          placeholder="Ex.: 15"
        />
        <Input
          label={current.labelB}
          id="pct-b"
          type="text"
          inputMode="decimal"
          value={b}
          onChange={(e) => { setB(e.target.value); reset(); }}
          placeholder="Ex.: 200"
        />
      </div>

      <Button onClick={calcular} size="md">
        Calcular
      </Button>

      {error && <ErrorBox message={error} />}
      {result && (
        <ResultBox>
          <span className="text-lg font-semibold">{result}</span>
        </ResultBox>
      )}
    </Card>
  );
}

// ─── 2. Regra de Três ─────────────────────────────────────────────────────────

function CalcRegraDeTres() {
  const [tipo, setTipo] = React.useState<"direta" | "inversa">("direta");
  const [a, setA] = React.useState("");
  const [b, setB] = React.useState("");
  const [c, setC] = React.useState("");
  const [result, setResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function reset() { setResult(null); setError(null); }

  function calcular() {
    setError(null);
    setResult(null);
    const na = parseFloat(a.replace(",", "."));
    const nb = parseFloat(b.replace(",", "."));
    const nc = parseFloat(c.replace(",", "."));
    if ([na, nb, nc].some(isNaN)) {
      setError("Preencha todos os três campos com números válidos.");
      return;
    }
    if (na === 0) { setError("O valor A não pode ser zero."); return; }
    const x = tipo === "direta" ? (nb * nc) / na : (na * nb) / nc;
    if (!isFinite(x)) { setError("Divisão por zero — revise os valores."); return; }
    setResult(
      `Se ${fmt(na)} → ${fmt(nb)}, então ${fmt(nc)} → ${fmt(x)}`,
    );
  }

  return (
    <Card className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-fg">Tipo de proporcionalidade</legend>
        <div className="flex gap-4">
          {(["direta", "inversa"] as const).map((t) => (
            <label key={t} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="r3-tipo"
                value={t}
                checked={tipo === t}
                onChange={() => { setTipo(t); reset(); }}
                className="accent-brand-500"
              />
              {t === "direta" ? "Direta" : "Inversa"}
            </label>
          ))}
        </div>
      </fieldset>

      <p className="rounded-lg bg-surface border border-border px-4 py-2 text-sm text-muted font-mono">
        {tipo === "direta"
          ? "A / B = C / X  →  X = (B × C) / A"
          : "A × B = C × X  →  X = (A × B) / C"}
      </p>

      <div className="grid grid-cols-3 gap-3">
        <Input label="A" id="r3-a" type="text" inputMode="decimal" value={a} onChange={(e) => { setA(e.target.value); reset(); }} placeholder="Ex.: 10" />
        <Input label="B" id="r3-b" type="text" inputMode="decimal" value={b} onChange={(e) => { setB(e.target.value); reset(); }} placeholder="Ex.: 30" />
        <Input label="C" id="r3-c" type="text" inputMode="decimal" value={c} onChange={(e) => { setC(e.target.value); reset(); }} placeholder="Ex.: 5" />
      </div>

      <Button onClick={calcular}>Calcular X</Button>

      {error && <ErrorBox message={error} />}
      {result && (
        <ResultBox>
          <span className="text-lg font-semibold">{result}</span>
        </ResultBox>
      )}
    </Card>
  );
}

// ─── 3. IMC ───────────────────────────────────────────────────────────────────

interface ImcClass {
  label: string;
  color: string;
}

function imcClassification(imc: number): ImcClass {
  if (imc < 18.5) return { label: "Abaixo do peso", color: "text-warning-700 dark:text-warning-500" };
  if (imc < 25) return { label: "Peso normal", color: "text-success-700 dark:text-success-500" };
  if (imc < 30) return { label: "Sobrepeso", color: "text-warning-700 dark:text-warning-500" };
  if (imc < 35) return { label: "Obesidade grau I", color: "text-danger-500" };
  if (imc < 40) return { label: "Obesidade grau II", color: "text-danger-700 dark:text-danger-500" };
  return { label: "Obesidade grau III", color: "text-danger-700 dark:text-danger-500" };
}

function CalcIMC() {
  const [peso, setPeso] = React.useState("");
  const [altura, setAltura] = React.useState("");
  const [result, setResult] = React.useState<{ imc: number; cls: ImcClass } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function reset() { setResult(null); setError(null); }

  function calcular() {
    setError(null);
    setResult(null);
    const np = parseFloat(peso.replace(",", "."));
    const na = parseFloat(altura.replace(",", "."));
    if (isNaN(np) || isNaN(na)) { setError("Preencha peso e altura com números válidos."); return; }
    if (np <= 0 || na <= 0) { setError("Peso e altura devem ser maiores que zero."); return; }
    // Aceita altura em cm (>3) ou metros
    const alturaM = na > 3 ? na / 100 : na;
    if (alturaM < 0.5 || alturaM > 2.7) { setError("Altura fora do intervalo válido (0,50 m a 2,70 m)."); return; }
    if (np < 2 || np > 600) { setError("Peso fora do intervalo válido (2 kg a 600 kg)."); return; }
    const imc = np / (alturaM * alturaM);
    setResult({ imc, cls: imcClassification(imc) });
  }

  return (
    <Card className="space-y-4">
      <p className="text-sm text-muted">
        Índice de Massa Corporal (IMC) = Peso (kg) ÷ Altura² (m). Informe a altura em metros (ex.:
        1,72) ou centímetros (ex.: 172).
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Peso (kg)"
          id="imc-peso"
          type="text"
          inputMode="decimal"
          value={peso}
          onChange={(e) => { setPeso(e.target.value); reset(); }}
          placeholder="Ex.: 70"
        />
        <Input
          label="Altura (m ou cm)"
          id="imc-altura"
          type="text"
          inputMode="decimal"
          value={altura}
          onChange={(e) => { setAltura(e.target.value); reset(); }}
          placeholder="Ex.: 1,75 ou 175"
        />
      </div>

      <Button onClick={calcular}>Calcular IMC</Button>

      {error && <ErrorBox message={error} />}
      {result && (
        <ResultBox>
          <p className="text-2xl font-bold">{fmt(result.imc, 2)}</p>
          <p className={cn("mt-1 font-semibold", result.cls.color)}>
            {result.cls.label}
          </p>
          <p className="mt-3 text-xs text-muted">
            Referência (adultos — OMS): Abaixo do peso &lt;18,5 | Normal 18,5–24,9 | Sobrepeso
            25–29,9 | Obesidade ≥30.{" "}
            <strong>Este resultado é apenas informativo. Consulte um profissional de saúde.</strong>
          </p>
        </ResultBox>
      )}
    </Card>
  );
}

// ─── 4. Conversor de Unidades ─────────────────────────────────────────────────

type ConvCategory = "comprimento" | "peso" | "temperatura";

interface ConvUnit {
  label: string;
  toBase: (v: number) => number; // convert to base unit
  fromBase: (v: number) => number; // convert from base unit
}

const CONV_UNITS: Record<ConvCategory, { baseLabel: string; units: Record<string, ConvUnit> }> = {
  comprimento: {
    baseLabel: "metros",
    units: {
      mm: { label: "Milímetros (mm)", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      cm: { label: "Centímetros (cm)", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      m: { label: "Metros (m)", toBase: (v) => v, fromBase: (v) => v },
      km: { label: "Quilômetros (km)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      in: { label: "Polegadas (in)", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      ft: { label: "Pés (ft)", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      mi: { label: "Milhas (mi)", toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    },
  },
  peso: {
    baseLabel: "gramas",
    units: {
      mg: { label: "Miligramas (mg)", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      g: { label: "Gramas (g)", toBase: (v) => v, fromBase: (v) => v },
      kg: { label: "Quilogramas (kg)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      t: { label: "Toneladas (t)", toBase: (v) => v * 1_000_000, fromBase: (v) => v / 1_000_000 },
      lb: { label: "Libras (lb)", toBase: (v) => v * 453.592, fromBase: (v) => v / 453.592 },
      oz: { label: "Onças (oz)", toBase: (v) => v * 28.3495, fromBase: (v) => v / 28.3495 },
    },
  },
  temperatura: {
    baseLabel: "°C",
    units: {
      C: { label: "Celsius (°C)", toBase: (v) => v, fromBase: (v) => v },
      F: { label: "Fahrenheit (°F)", toBase: (v) => (v - 32) * (5 / 9), fromBase: (v) => v * (9 / 5) + 32 },
      K: { label: "Kelvin (K)", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    },
  },
};

function CalcConversor() {
  const [cat, setCat] = React.useState<ConvCategory>("comprimento");
  const unitKeys = Object.keys(CONV_UNITS[cat].units);
  const [from, setFrom] = React.useState<string>(unitKeys[0]);
  const [to, setTo] = React.useState<string>(unitKeys[2]);
  const [value, setValue] = React.useState("");
  const [result, setResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function handleCatChange(c: ConvCategory) {
    setCat(c);
    const keys = Object.keys(CONV_UNITS[c].units);
    setFrom(keys[0]);
    setTo(keys[2] ?? keys[1]);
    setValue("");
    setResult(null);
    setError(null);
  }

  function reset() { setResult(null); setError(null); }

  function converter() {
    setError(null);
    setResult(null);
    const nv = parseFloat(value.replace(",", "."));
    if (isNaN(nv)) { setError("Insira um número válido."); return; }
    const catData = CONV_UNITS[cat];
    const fromUnit = catData.units[from];
    const toUnit = catData.units[to];
    if (!fromUnit || !toUnit) { setError("Unidade inválida."); return; }
    const base = fromUnit.toBase(nv);
    const converted = toUnit.fromBase(base);
    if (!isFinite(converted)) { setError("Conversão inválida para os valores fornecidos."); return; }
    setResult(
      `${fmtConv(nv)} ${from} = ${fmtConv(converted)} ${to}`,
    );
  }

  const catLabels: Record<ConvCategory, string> = {
    comprimento: "Comprimento",
    peso: "Peso / Massa",
    temperatura: "Temperatura",
  };

  const currentUnits = CONV_UNITS[cat].units;

  return (
    <Card className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-fg">Categoria</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(catLabels) as ConvCategory[]).map((c) => (
            <label key={c} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="conv-cat"
                value={c}
                checked={cat === c}
                onChange={() => handleCatChange(c)}
                className="accent-brand-500"
              />
              {catLabels[c]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="conv-from" className="mb-1 block text-sm font-medium text-fg">
            De
          </label>
          <select
            id="conv-from"
            value={from}
            onChange={(e) => { setFrom(e.target.value); reset(); }}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {Object.entries(currentUnits).map(([key, u]) => (
              <option key={key} value={key}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="conv-to" className="mb-1 block text-sm font-medium text-fg">
            Para
          </label>
          <select
            id="conv-to"
            value={to}
            onChange={(e) => { setTo(e.target.value); reset(); }}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {Object.entries(currentUnits).map(([key, u]) => (
              <option key={key} value={key}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Input
        label="Valor"
        id="conv-value"
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => { setValue(e.target.value); reset(); }}
        placeholder="Ex.: 100"
      />

      <Button onClick={converter}>Converter</Button>

      {error && <ErrorBox message={error} />}
      {result && (
        <ResultBox>
          <span className="text-lg font-semibold">{result}</span>
        </ResultBox>
      )}
    </Card>
  );
}

// ─── 5. Dias entre datas ──────────────────────────────────────────────────────

function CalcDias() {
  const today = todayIso();
  const [d1, setD1] = React.useState(today);
  const [d2, setD2] = React.useState(today);
  const [result, setResult] = React.useState<{
    dias: number;
    semanas: number;
    meses: string;
    anos: string;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function reset() { setResult(null); setError(null); }

  function calcular() {
    setError(null);
    setResult(null);
    if (!d1 || !d2) { setError("Selecione as duas datas."); return; }
    const dt1 = new Date(d1);
    const dt2 = new Date(d2);
    if (isNaN(dt1.getTime()) || isNaN(dt2.getTime())) {
      setError("Datas inválidas.");
      return;
    }
    const start = dt1 <= dt2 ? dt1 : dt2;
    const end = dt1 <= dt2 ? dt2 : dt1;
    const diffMs = end.getTime() - start.getTime();
    const dias = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const semanas = Math.floor(dias / 7);
    // Diferença em meses/anos aproximada
    let anos = end.getFullYear() - start.getFullYear();
    let meses = end.getMonth() - start.getMonth();
    if (meses < 0) { anos--; meses += 12; }
    setResult({
      dias,
      semanas,
      meses: `${anos} ano${anos !== 1 ? "s" : ""} e ${meses} mes${meses !== 1 ? "es" : ""}`,
      anos: anos === 0 && meses === 0 ? "menos de 1 mês" : "",
    });
  }

  return (
    <Card className="space-y-4">
      <p className="text-sm text-muted">
        Calcule quantos dias, semanas ou meses existem entre duas datas.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="dias-d1" className="mb-1 block text-sm font-medium text-fg">
            Data inicial
          </label>
          <input
            id="dias-d1"
            type="date"
            value={d1}
            onChange={(e) => { setD1(e.target.value); reset(); }}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label htmlFor="dias-d2" className="mb-1 block text-sm font-medium text-fg">
            Data final
          </label>
          <input
            id="dias-d2"
            type="date"
            value={d2}
            onChange={(e) => { setD2(e.target.value); reset(); }}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <Button onClick={calcular}>Calcular</Button>

      {error && <ErrorBox message={error} />}
      {result && (
        <ResultBox>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted">Dias</dt>
              <dd className="text-xl font-bold">{result.dias}</dd>
            </div>
            <div>
              <dt className="text-muted">Semanas</dt>
              <dd className="text-xl font-bold">{result.semanas}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted">Aproximado</dt>
              <dd className="text-base font-semibold">
                {result.anos || result.meses}
              </dd>
            </div>
          </dl>
        </ResultBox>
      )}
    </Card>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formata número em pt-BR com até `decimals` casas significativas. */
function fmt(n: number, decimals = 6): string {
  // Remove zeros à direita
  const s = n.toLocaleString("pt-BR", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  });
  return s;
}

/** Formatação para conversores — mais casas para valores pequenos. */
function fmtConv(n: number): string {
  if (Math.abs(n) < 0.001 && n !== 0) {
    return n.toLocaleString("pt-BR", { maximumSignificantDigits: 6 });
  }
  return fmt(n, 8);
}

/** Data de hoje no formato YYYY-MM-DD (para input[type=date]). */
function todayIso(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
