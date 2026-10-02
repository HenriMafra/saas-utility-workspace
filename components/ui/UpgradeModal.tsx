"use client";

import { useEffect, useRef } from "react";
import { X, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  /** Short description of why the upgrade is needed, e.g. "Você atingiu o limite de hoje." */
  context?: string;
}

export function UpgradeModal({ open, onClose, context }: UpgradeModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Drive the native <dialog> open/close
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
      // Trap focus on close button
      closeBtnRef.current?.focus();
    } else {
      if (el.open) el.close();
    }
  }, [open]);

  // Allow pressing Escape to close via native dialog
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const handler = () => onClose();
    el.addEventListener("cancel", handler);
    return () => el.removeEventListener("cancel", handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        "fixed inset-0 z-50 m-auto max-h-[90vh] w-full max-w-md rounded-2xl border border-border bg-bg p-0 shadow-2xl",
        "backdrop:bg-black/50 backdrop:backdrop-blur-sm",
      )}
      aria-labelledby="upgrade-modal-title"
      aria-describedby="upgrade-modal-desc"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-brand-500" aria-hidden />
          <span id="upgrade-modal-title" className="font-display text-lg font-semibold">
            Atualize seu plano
          </span>
        </div>
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          aria-label="Fechar modal"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-6">
        {context && (
          <p id="upgrade-modal-desc" className="mb-4 text-sm text-muted">
            {context}
          </p>
        )}

        <div className="space-y-3">
          {/* Pro highlight */}
          <div className="rounded-xl border border-brand-500 bg-brand-50 p-4 dark:bg-brand-950/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Pro</p>
                <p className="text-sm text-muted">500 operações/mês · R$ 19,90/mês</p>
              </div>
              <Link href="/precos" onClick={onClose}>
                <Button size="sm">Ver planos</Button>
              </Link>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm text-muted">
              {[
                "Todas as ferramentas desbloqueadas",
                "Arquivos até 100 MB",
                "Processamento no servidor",
                "Pix e cartão aceitos",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Business mention */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Business</p>
                <p className="text-sm text-muted">Operações ilimitadas · R$ 49,90/mês</p>
              </div>
              <Link href="/precos" onClick={onClose}>
                <Button size="sm" variant="secondary">Saiba mais</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-6 py-4 text-center">
        <p className="text-xs text-muted">
          Cancele quando quiser. Sem fidelidade.{" "}
          <Link href="/precos" className="text-brand-500 hover:underline" onClick={onClose}>
            Ver todos os planos
          </Link>
        </p>
      </div>
    </dialog>
  );
}
