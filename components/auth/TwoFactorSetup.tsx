"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff, Download, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Step = "idle" | "qr" | "verify" | "backup" | "enabled" | "disable-confirm";

interface EnrollData {
  factorId: string;
  qrCode: string; // SVG URI from Supabase
  secret: string;
}

/** Generate 8 mock backup codes (16-char alphanumeric) for display and download. */
function generateBackupCodes(): string[] {
  return Array.from({ length: 8 }, () =>
    Array.from({ length: 4 }, () =>
      Math.random().toString(36).slice(2, 6).toUpperCase()
    ).join("-")
  );
}

export function TwoFactorSetup() {
  const [step, setStep] = useState<Step>("idle");
  const [enrollData, setEnrollData] = useState<EnrollData | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  // Track whether user already has MFA enabled (resolved at enrollment time)
  const [mfaActive, setMfaActive] = useState(false);

  // --- Enroll: start TOTP factor ---
  const handleStartEnroll = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator app",
      });
      if (error) throw error;

      setEnrollData({
        factorId: data.id,
        qrCode: data.totp.qr_code, // SVG data URI
        secret: data.totp.secret,
      });
      setStep("qr");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao iniciar configuração.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Verify the TOTP code to complete enrollment ---
  const handleVerify = useCallback(async () => {
    if (!enrollData) return;
    const trimmed = code.trim().replace(/\s/g, "");
    if (!/^\d{6}$/.test(trimmed)) {
      setCodeError("O código deve ter exatamente 6 dígitos.");
      return;
    }

    setCodeError(null);
    setLoading(true);
    try {
      const supabase = createClient();

      // Challenge
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: enrollData.factorId });
      if (challengeError) throw challengeError;

      // Verify
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollData.factorId,
        challengeId: challengeData.id,
        code: trimmed,
      });
      if (verifyError) throw verifyError;

      const codes = generateBackupCodes();
      setBackupCodes(codes);
      setCode("");
      setStep("backup");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Código inválido ou expirado. Tente novamente.";
      setCodeError(msg);
    } finally {
      setLoading(false);
    }
  }, [enrollData, code]);

  // --- Download backup codes as .txt ---
  const handleDownloadCodes = useCallback(() => {
    const content = [
      "Códigos de backup Praticca — 2FA",
      "Guarde esses códigos em um lugar seguro.",
      "Cada código só pode ser usado uma vez.",
      "",
      ...backupCodes,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "praticca-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [backupCodes]);

  const handleBackupDone = useCallback(() => {
    setMfaActive(true);
    setStep("enabled");
    toast.success("Autenticação em dois fatores ativada!");
  }, []);

  // --- Unenroll / disable ---
  const handleDisable = useCallback(async () => {
    if (!enrollData) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.mfa.unenroll({ factorId: enrollData.factorId });
      if (error) throw error;

      setMfaActive(false);
      setEnrollData(null);
      setStep("idle");
      toast.success("Autenticação em dois fatores desativada.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Não foi possível desativar o 2FA.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [enrollData]);

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <CardTitle>Autenticação em dois fatores (2FA)</CardTitle>
          <CardDescription className="mt-1">
            Proteja sua conta com um aplicativo autenticador (Google Authenticator, Authy, etc.).
          </CardDescription>
        </div>
        <span
          aria-label={mfaActive ? "2FA ativo" : "2FA inativo"}
          className={cn(
            "mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            mfaActive
              ? "bg-success-500/10 text-success-700 dark:text-success-500"
              : "bg-neutral-100 text-muted dark:bg-neutral-800"
          )}
        >
          {mfaActive ? (
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <ShieldOff className="h-3.5 w-3.5" aria-hidden />
          )}
          {mfaActive ? "Ativo" : "Inativo"}
        </span>
      </div>

      {/* ── Idle: start setup ── */}
      {step === "idle" && (
        <div className="mt-5">
          <Button
            onClick={handleStartEnroll}
            loading={loading}
            leftIcon={<ShieldCheck className="h-4 w-4" aria-hidden />}
          >
            Ativar autenticação em dois fatores
          </Button>
        </div>
      )}

      {/* ── QR Code step ── */}
      {step === "qr" && enrollData && (
        <div className="mt-6 space-y-5">
          <div>
            <p className="mb-3 text-sm text-fg font-medium">
              1. Escaneie o QR code com seu aplicativo autenticador:
            </p>
            <div
              className="inline-flex rounded-xl border border-border bg-white p-3"
              aria-label="QR code para configurar o 2FA"
            >
              {/* Supabase returns a data URI SVG */}
              <Image
                src={enrollData.qrCode}
                alt="QR code de configuração do 2FA"
                width={160}
                height={160}
                unoptimized
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-bg p-3">
            <p className="mb-1 text-xs font-medium text-muted uppercase tracking-wide">
              Ou insira a chave manualmente:
            </p>
            <code
              className="select-all break-all font-mono text-sm text-fg"
              aria-label="Chave secreta para o autenticador"
            >
              {enrollData.secret}
            </code>
          </div>

          <Button variant="secondary" onClick={() => setStep("verify")}>
            Já escaneei — continuar
          </Button>
        </div>
      )}

      {/* ── Verify code step ── */}
      {step === "verify" && (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-fg">
            2. Digite o código de 6 dígitos exibido no seu aplicativo autenticador:
          </p>

          <Input
            label="Código de verificação"
            id="totp-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              if (codeError) setCodeError(null);
            }}
            error={codeError ?? undefined}
            placeholder="000000"
          />

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setStep("qr")}
              disabled={loading}
            >
              Voltar
            </Button>
            <Button
              onClick={handleVerify}
              loading={loading}
              disabled={code.length !== 6}
            >
              Verificar e ativar
            </Button>
          </div>
        </div>
      )}

      {/* ── Backup codes step ── */}
      {step === "backup" && (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-warning-500/40 bg-warning-500/5 p-4">
            <p className="mb-1 text-sm font-medium text-fg">
              Guarde seus códigos de backup
            </p>
            <p className="text-sm text-muted">
              Se você perder o acesso ao aplicativo autenticador, use um desses códigos para
              entrar. Cada código só pode ser usado uma vez.
            </p>
          </div>

          <ol
            aria-label="Códigos de backup"
            className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-bg p-4"
          >
            {backupCodes.map((c, i) => (
              <li key={c} className="flex items-center gap-2">
                <span className="text-xs text-muted w-4">{i + 1}.</span>
                <code className="select-all font-mono text-sm text-fg">{c}</code>
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              leftIcon={<Download className="h-4 w-4" aria-hidden />}
              onClick={handleDownloadCodes}
            >
              Baixar códigos
            </Button>
            <Button onClick={handleBackupDone}>
              Salvei meus códigos — concluir
            </Button>
          </div>
        </div>
      )}

      {/* ── Enabled state ── */}
      {(step === "enabled" || step === "disable-confirm") && (
        <div className="mt-5">
          {step === "disable-confirm" ? (
            <div className="space-y-3">
              <p className="text-sm text-danger-500 font-medium">
                Tem certeza? Isso removerá a proteção extra da sua conta.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  disabled={loading}
                  onClick={() => setStep("enabled")}
                >
                  Cancelar
                </Button>
                <Button variant="danger" loading={loading} onClick={handleDisable}>
                  Sim, desativar 2FA
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="secondary"
              leftIcon={<ShieldOff className="h-4 w-4" aria-hidden />}
              onClick={() => setStep("disable-confirm")}
            >
              Desativar autenticação em dois fatores
            </Button>
          )}

          {step !== "disable-confirm" && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
              <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Para gerar novos códigos de backup, desative e reative o 2FA.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
