"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface FaqItem {
  q: string;
  a: string;
}

interface FaqProps {
  items: FaqItem[];
  /** Título da seção exibido na página (default: "Perguntas frequentes") */
  heading?: string;
  /** Inclui script JSON-LD FAQPage para SEO estruturado */
  withJsonLd?: boolean;
  className?: string;
}

/**
 * Componente reutilizável de FAQ acessível com acordeão.
 * Aceita `withJsonLd` para injetar o schema FAQPage diretamente.
 */
export function Faq({ items, heading = "Perguntas frequentes", withJsonLd = false, className }: FaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(index: number) {
    setOpenIndex((prev) => (prev === index ? null : index));
  }

  const jsonLd = withJsonLd
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      }
    : null;

  return (
    <section aria-labelledby="faq-heading" className={cn("w-full", className)}>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <h2
        id="faq-heading"
        className="text-2xl font-semibold text-foreground mb-6"
      >
        {heading}
      </h2>

      <dl className="divide-y divide-border rounded-xl border border-border overflow-hidden">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          const panelId = `faq-panel-${index}`;
          const triggerId = `faq-trigger-${index}`;

          return (
            <div key={index} className="bg-surface">
              <dt>
                <button
                  id={triggerId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(index)}
                  className={cn(
                    "flex w-full items-center justify-between gap-4 px-5 py-4 text-left",
                    "text-sm font-medium text-foreground",
                    "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset",
                    "transition-colors duration-150",
                  )}
                >
                  <span>{item.q}</span>
                  <ChevronIcon open={isOpen} />
                </button>
              </dt>

              <dd
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                hidden={!isOpen}
                className={cn(
                  "px-5 pb-5 text-sm text-muted leading-relaxed",
                  isOpen ? "block" : "hidden",
                )}
              >
                {item.a}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "shrink-0 text-muted transition-transform duration-200",
        open && "rotate-180",
      )}
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
