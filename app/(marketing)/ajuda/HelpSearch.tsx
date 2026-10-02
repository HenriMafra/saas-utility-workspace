"use client";

import { useState, useId } from "react";
import { Search, ChevronDown } from "lucide-react";
import type { FaqItem } from "./types";

interface HelpSection {
  id: string;
  title: string;
  items: FaqItem[];
}

interface HelpSearchProps {
  sections: HelpSection[];
}

export function HelpSearch({ sections }: HelpSearchProps) {
  const [query, setQuery] = useState("");
  const inputId = useId();

  const q = query.trim().toLowerCase();

  const filtered: HelpSection[] = q
    ? sections
        .map((sec) => ({
          ...sec,
          items: sec.items.filter(
            (item) =>
              item.q.toLowerCase().includes(q) ||
              item.a.toLowerCase().includes(q) ||
              item.tags.some((t) => t.toLowerCase().includes(q)),
          ),
        }))
        .filter((sec) => sec.items.length > 0)
    : sections;

  return (
    <>
      {/* Campo de busca */}
      <div className="mb-8">
        <label htmlFor={inputId} className="sr-only">
          Buscar na Central de Ajuda
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            id={inputId}
            type="search"
            placeholder="Buscar perguntas… (ex.: limite, reembolso, cancelar)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-surface pl-9 pr-4 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Resultados / accordions */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted" role="status">
          Nenhum resultado para &ldquo;{query}&rdquo;. Tente outras palavras ou entre em{" "}
          <a href="#contato" className="text-brand-500 hover:underline">
            contato
          </a>
          .
        </p>
      ) : (
        <div className="space-y-10">
          {filtered.map((sec) => (
            <section key={sec.id} aria-labelledby={`sec-${sec.id}`}>
              <h2
                id={`sec-${sec.id}`}
                className="mb-4 font-display text-xl font-semibold"
              >
                {sec.title}
              </h2>
              <dl className="space-y-2">
                {sec.items.map((item) => (
                  <AccordionItem key={item.q} item={item} />
                ))}
              </dl>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function AccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="rounded-xl border border-border bg-surface">
      <dt>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-xl"
        >
          <span>{item.q}</span>
          <ChevronDown
            className={`h-4 w-4 flex-shrink-0 text-muted transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>
      </dt>
      <dd
        id={panelId}
        role="region"
        aria-labelledby={undefined}
        hidden={!open}
        className="px-5 pb-4 text-sm text-muted leading-relaxed"
      >
        {item.a}
      </dd>
    </div>
  );
}
