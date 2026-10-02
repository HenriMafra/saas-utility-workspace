"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

const RULES = [
  { id: "length",    label: "Mínimo de 8 caracteres",                   test: (v: string) => v.length >= 8 },
  { id: "uppercase", label: "Pelo menos uma letra maiúscula (A–Z)",      test: (v: string) => /[A-Z]/.test(v) },
  { id: "lowercase", label: "Pelo menos uma letra minúscula (a–z)",      test: (v: string) => /[a-z]/.test(v) },
  { id: "number",    label: "Pelo menos um número (0–9)",               test: (v: string) => /[0-9]/.test(v) },
  { id: "symbol",    label: "Pelo menos um símbolo (!@#$%…)",           test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const;

// ---------------------------------------------------------------------------
// Strength levels
// ---------------------------------------------------------------------------

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

interface StrengthInfo {
  level: StrengthLevel;
  label: string;
  color: string;
  /** width percent of the bar */
  widthClass: string;
}

function getStrengthInfo(passed: number): StrengthInfo {
  if (passed === 0) return { level: 0, label: "",           color: "bg-border",       widthClass: "w-0"     };
  if (passed <= 2)  return { level: 1, label: "Fraca",      color: "bg-danger-500",   widthClass: "w-1/4"   };
  if (passed === 3) return { level: 2, label: "Razoável",   color: "bg-warning-500",  widthClass: "w-2/4"   };
  if (passed === 4) return { level: 3, label: "Boa",        color: "bg-brand-500",    widthClass: "w-3/4"   };
  return              { level: 4, label: "Forte",           color: "bg-success-500",  widthClass: "w-full"  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

export function PasswordStrengthMeter({ password, className }: PasswordStrengthMeterProps) {
  const results = useMemo(
    () => RULES.map((r) => ({ ...r, passed: r.test(password) })),
    [password],
  );

  const passed  = results.filter((r) => r.passed).length;
  const info    = getStrengthInfo(password.length === 0 ? 0 : passed);

  return (
    <div className={cn("space-y-3", className)} aria-label="Força da senha">
      {/* Bar */}
      <div className="space-y-1">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-border"
          role="progressbar"
          aria-valuenow={passed}
          aria-valuemin={0}
          aria-valuemax={RULES.length}
          aria-label={info.label || "Nenhuma"}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              info.color,
              info.widthClass,
            )}
          />
        </div>
        {info.label && (
          <p className="text-xs text-muted">
            Força: <span className="font-medium text-fg">{info.label}</span>
          </p>
        )}
      </div>

      {/* Checklist */}
      <ul className="space-y-1" aria-label="Requisitos de senha">
        {results.map((r) => (
          <li
            key={r.id}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              r.passed ? "text-success-500" : "text-muted",
            )}
          >
            {r.passed ? (
              <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
            ) : (
              <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
            )}
            <span>{r.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
