"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Copy, Check, RefreshCw, Sparkles, FileText, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { UsageMeter } from "@/components/ui/UsageMeter";
import { getTool } from "@/lib/tools/registry";
import { cn } from "@/lib/utils";

type Action = "corrigir" | "resumir" | "melhorar";

interface ActionDef {
  id: Action;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const ACTIONS: ActionDef[] = [
  {
    id: "corrigir",
    label: "Corrigir",
    description: "Gramática, ortografia e pontuação",
    icon: <FileText className="h-4 w-4" aria-hidden />,
  },
  {
    id: "resumir",
    label: "Resumir",
    description: "Síntese das ideias principais",
    icon: <Sparkles className="h-4 w-4" aria-hidden />,
  },
  {
    id: "melhorar",
    label: "Melhorar",
    description: "Estilo mais fluente e profissional",
    icon: <Wand2 className="h-4 w-4" aria-hidden />,
  },
];

const MAX_CHARS = 5000;

export default function Runner() {
  const tool = getTool("assistente-de-texto");
  const limit = tool?.limits.anonPerDay ?? 1;

  const [inputText, setInputText] = useState("");
  const [resultText, setResultText] = useState("");
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLTextAreaElement>(null);

  const remaining = MAX_CHARS - inputText.length;
  const canSubmit = inputText.trim().length > 0 && !isLoading;

  async function handleAction(action: Action) {
    if (!canSubmit) return;

    setActiveAction(action);
    setIsLoading(true);
    setResultText("");

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, text: inputText.trim() }),
      });

      const data = (await res.json()) as { text?: string; error?: string };

      if (!res.ok) {
        const msg =
          res.status === 503
            ? "Assistente indisponível no momento. Tente novamente em instantes."
            : data.error ?? "Algo deu errado. Tente novamente.";
        toast.error(msg);
        return;
      }

      if (!data.text) {
        toast.error("O assistente retornou uma resposta vazia.");
        return;
      }

      setResultText(data.text);
      // Scroll to result on mobile
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch {
      toast.error("Não foi possível conectar ao assistente. Verifique sua conexão e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!resultText) return;
    try {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      toast.success("Texto copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto manualmente.");
    }
  }

  function handleReset() {
    setInputText("");
    setResultText("");
    setActiveAction(null);
    setCopied(false);
  }

  const actionLabel: Record<Action, string> = {
    corrigir: "Corrigindo texto…",
    resumir: "Resumindo texto…",
    melhorar: "Melhorando texto…",
  };

  return (
    <div className="space-y-6">
      {/* Usage meter */}
      <UsageMeter used={0} limit={limit} />

      {/* Input area */}
      <div className="space-y-2">
        <label htmlFor="input-text" className="block text-sm font-medium text-fg">
          Seu texto
        </label>
        <textarea
          id="input-text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          maxLength={MAX_CHARS}
          placeholder="Cole ou escreva seu texto aqui…"
          aria-describedby="char-counter"
          className={cn(
            "w-full min-h-[180px] resize-y rounded-xl border border-border bg-bg p-4 text-sm text-fg",
            "placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
            "transition-colors",
          )}
          disabled={isLoading}
        />
        <div id="char-counter" className="flex justify-end text-xs text-muted" aria-live="polite">
          <span className={remaining < 200 ? "text-warning-500" : ""}>
            {remaining.toLocaleString("pt-BR")} caracteres restantes
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div
        role="group"
        aria-label="Escolha uma ação para o texto"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => handleAction(action.id)}
            disabled={!canSubmit}
            aria-pressed={activeAction === action.id && !!resultText}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              "disabled:pointer-events-none disabled:opacity-50",
              activeAction === action.id && isLoading
                ? "border-brand-500 bg-brand-500/10"
                : activeAction === action.id && resultText
                  ? "border-brand-500 bg-brand-500/5"
                  : "border-border bg-surface hover:border-brand-500/50 hover:bg-surface",
            )}
          >
            <span className="mt-0.5 text-brand-500">{action.icon}</span>
            <div>
              <span className="block text-sm font-medium text-fg">{action.label}</span>
              <span className="block text-xs text-muted">{action.description}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-3 rounded-xl border border-border bg-surface py-8"
        >
          <Spinner />
          <span className="text-sm text-muted">
            {activeAction ? actionLabel[activeAction] : "Processando…"}
          </span>
        </div>
      )}

      {/* Result area */}
      {!isLoading && resultText && (
        <div className="space-y-2" aria-live="polite" aria-label="Resultado do assistente">
          <div className="flex items-center justify-between">
            <label htmlFor="result-text" className="block text-sm font-medium text-fg">
              Resultado
              {activeAction && (
                <span className="ml-2 text-xs font-normal text-muted">
                  — {ACTIONS.find((a) => a.id === activeAction)?.label}
                </span>
              )}
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              aria-label="Copiar resultado"
              leftIcon={
                copied ? (
                  <Check className="h-4 w-4 text-success-500" aria-hidden />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden />
                )
              }
            >
              {copied ? "Copiado!" : "Copiar"}
            </Button>
          </div>

          <textarea
            id="result-text"
            ref={resultRef}
            value={resultText}
            onChange={(e) => setResultText(e.target.value)}
            aria-label="Texto processado pelo assistente — editável"
            className={cn(
              "w-full min-h-[180px] resize-y rounded-xl border border-success-500/40 bg-success-100/20 p-4 text-sm text-fg",
              "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
              "transition-colors",
            )}
          />

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" aria-hidden />}
              onClick={handleReset}
            >
              Novo texto
            </Button>
            <p className="text-xs text-muted">
              O resultado é editável. Ajuste conforme necessário antes de usar.
            </p>
          </div>
        </div>
      )}

      {/* Premium notice */}
      <p className="text-xs text-muted" role="note">
        Ferramenta premium — consome 2 créditos por uso. Os créditos são debitados após o processamento.
      </p>
    </div>
  );
}
