"use client";

import { useEffect, useRef, useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  impact: string;
  /** Se definido, o usuário deve digitar exatamente esse texto para confirmar. */
  requireText?: string;
  /** Se true, um campo "Motivo" obrigatório é exibido. */
  reasonRequired?: boolean;
  onConfirm: (reason: string) => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  impact,
  requireText,
  reasonRequired = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement | HTMLInputElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Reset state whenever dialog opens
  useEffect(() => {
    if (open) {
      setTyped("");
      setReason("");
      setLoading(false);
      // Delay focus to after paint
      const id = setTimeout(() => {
        firstFocusRef.current?.focus();
      }, 50);
      return () => clearTimeout(id);
    }
  }, [open]);

  // Trap focus inside dialog
  useEffect(() => {
    if (!open) return;
    const dialog = overlayRef.current;
    if (!dialog) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = Array.from(
        dialog!.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.closest("[aria-hidden=true]"));

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    dialog.addEventListener("keydown", handleKeyDown);
    return () => dialog.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const confirmReady =
    (!requireText || typed === requireText) &&
    (!reasonRequired || reason.trim().length > 0);

  async function handleConfirm() {
    if (!confirmReady) return;
    setLoading(true);
    try {
      await onConfirm(reason.trim());
      onClose();
    } finally {
      setLoading(false);
    }
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div
        className={cn(
          "relative w-full max-w-md rounded-xl border border-border bg-bg p-6 shadow-xl",
          "focus:outline-none",
        )}
        tabIndex={-1}
      >
        {/* Fechar */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Fechar diálogo"
          className="absolute right-4 top-4 rounded-md p-1 text-muted transition-colors hover:bg-surface hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        {/* Ícone de aviso */}
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-danger-500/10">
          <AlertTriangle className="h-5 w-5 text-danger-500" aria-hidden />
        </div>

        {/* Título */}
        <h2 id="confirm-dialog-title" className="mb-2 font-display text-lg font-semibold text-fg">
          {title}
        </h2>

        {/* Impacto */}
        <p id="confirm-dialog-desc" className="mb-5 text-sm text-muted">
          {impact}
        </p>

        {/* Campo requireText */}
        {requireText && (
          <div className="mb-4">
            <Input
              ref={firstFocusRef as React.Ref<HTMLInputElement>}
              label={`Digite "${requireText}" para confirmar`}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              aria-required="true"
              error={
                typed.length > 0 && typed !== requireText
                  ? `Texto incorreto — digite exatamente: ${requireText}`
                  : undefined
              }
            />
          </div>
        )}

        {/* Campo motivo */}
        {reasonRequired && (
          <div className="mb-5">
            <Input
              ref={!requireText ? (firstFocusRef as React.Ref<HTMLInputElement>) : undefined}
              label="Motivo da ação"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              hint="Obrigatório — registrado no log de auditoria."
              aria-required="true"
            />
          </div>
        )}

        {/* Ações */}
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={loading}
            ref={!requireText && !reasonRequired ? (firstFocusRef as React.Ref<HTMLButtonElement>) : undefined}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={loading}
            disabled={!confirmReady}
            onClick={handleConfirm}
            aria-disabled={!confirmReady}
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}
