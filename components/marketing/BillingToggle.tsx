"use client";

import { cn } from "@/lib/utils";

interface BillingToggleProps {
  value: "month" | "year";
  onChange: (v: "month" | "year") => void;
}

export function BillingToggle({ value, onChange }: BillingToggleProps) {
  return (
    <div className="inline-flex items-center gap-3" role="group" aria-label="Período de cobrança">
      <button
        type="button"
        onClick={() => onChange("month")}
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
          value === "month"
            ? "bg-brand-500 text-white shadow-sm"
            : "text-muted hover:text-fg",
        )}
        aria-pressed={value === "month"}
      >
        Mensal
      </button>

      {/* Toggle pill */}
      <div
        role="presentation"
        className="relative h-7 w-14 cursor-pointer rounded-full bg-neutral-200 dark:bg-neutral-700"
        onClick={() => onChange(value === "month" ? "year" : "month")}
        aria-hidden
      >
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-brand-500 shadow transition-transform duration-200",
            value === "year" ? "translate-x-8" : "translate-x-1",
          )}
        />
      </div>

      <button
        type="button"
        onClick={() => onChange("year")}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
          value === "year"
            ? "bg-brand-500 text-white shadow-sm"
            : "text-muted hover:text-fg",
        )}
        aria-pressed={value === "year"}
      >
        Anual
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-xs font-semibold",
            value === "year"
              ? "bg-white/20 text-white"
              : "bg-success-500/20 text-success-700 dark:text-success-400",
          )}
        >
          -17%
        </span>
      </button>
    </div>
  );
}
