"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const STORAGE_KEY = "praticca-cookie-consent";

type ConsentValue = "essential" | "all" | null;

function getStoredConsent(): ConsentValue {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "essential" || raw === "all") return raw;
  } catch {
    // localStorage not available (private browsing, etc.)
  }
  return null;
}

function saveConsent(value: "essential" | "all") {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

/**
 * CookieConsent — banner de consentimento de cookies.
 *
 * Exibe um banner fixo no rodapé enquanto o usuário não tiver escolhido.
 * Salva a escolha em localStorage (chave: praticca-cookie-consent).
 * Por padrão, apenas cookies essenciais são ativados.
 *
 * Integração: adicione <CookieConsent /> no app/(marketing)/layout.tsx
 * (ou em qualquer layout pai). O componente não renderiza nada no servidor.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      // Small delay so the banner doesn't flash on navigation
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  if (!visible) return null;

  function handleAcceptAll() {
    saveConsent("all");
    setVisible(false);
  }

  function handleEssentialOnly() {
    saveConsent("essential");
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Aviso de cookies"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-surface shadow-2xl shadow-black/20 dark:shadow-black/50 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Icon */}
          <span
            className="text-2xl select-none flex-shrink-0 hidden sm:block"
            aria-hidden="true"
          >
            🍪
          </span>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-fg text-sm sm:text-base">
              Usamos cookies para melhorar sua experiência
            </p>
            <p className="mt-1 text-sm text-muted leading-relaxed">
              Usamos cookies essenciais para o funcionamento do site (login e
              segurança) e, com sua permissão, cookies de análise anônima para
              entender como melhorar nossos serviços.{" "}
              <Link
                href="/legal/cookies"
                className="underline underline-offset-2 hover:text-brand-600 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
              >
                Saiba mais
              </Link>
              .
            </p>

            {/* Details toggle */}
            {showDetails && (
              <div className="mt-3 rounded-lg bg-bg border border-border p-3 text-xs text-muted space-y-2">
                <div>
                  <span className="font-semibold text-fg">Essenciais (sempre ativos):</span>{" "}
                  sessão de autenticação, preferências de tema e consentimento de
                  cookies.
                </div>
                <div>
                  <span className="font-semibold text-fg">Analytics (opcional):</span>{" "}
                  Plausible Analytics — dados agregados e anonimizados, sem
                  rastreamento entre sites ou identificação pessoal.
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="mt-2 text-xs text-muted underline underline-offset-2 hover:text-fg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 rounded"
              aria-expanded={showDetails}
            >
              {showDetails ? "Ocultar detalhes" : "Ver detalhes"}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEssentialOnly}
            aria-label="Aceitar apenas cookies essenciais"
          >
            Apenas essenciais
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAcceptAll}
            aria-label="Aceitar todos os cookies incluindo analytics"
          >
            Aceitar todos
          </Button>
        </div>
      </div>
    </div>
  );
}
