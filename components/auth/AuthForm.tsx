"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { publicEnv } from "@/lib/env";
import { track } from "@/lib/analytics/track";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";

import {
  SignInSchema,  type SignInInput,
  SignUpSchema,  type SignUpInput,
  ResetRequestSchema, type ResetRequestInput,
  NewPasswordSchema,  type NewPasswordInput,
} from "@/schemas/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuthMode = "login" | "signup" | "reset" | "new-password";

interface AuthFormProps {
  mode: AuthMode;
}

// ---------------------------------------------------------------------------
// Error mapping: Supabase → user-facing neutral message
// ---------------------------------------------------------------------------

function humanizeError(err: { message?: string; status?: number } | null): string {
  if (!err) return "Algo deu errado. Tente novamente.";

  const msg = (err.message ?? "").toLowerCase();

  // Credentials — neutral: don't reveal whether it's the e-mail or password
  if (
    msg.includes("invalid login credentials") ||
    msg.includes("invalid email") ||
    msg.includes("invalid password") ||
    msg.includes("no user found")
  )
    return "Dados incorretos. Verifique e tente novamente.";

  // Rate limits
  if (msg.includes("too many") || msg.includes("rate limit") || err.status === 429)
    return "Muitas tentativas. Aguarde alguns minutos e tente de novo.";

  // Email not confirmed
  if (msg.includes("email not confirmed") || msg.includes("confirm your email"))
    return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.";

  // Weak password (Supabase-side policy)
  if (msg.includes("password") && (msg.includes("weak") || msg.includes("strength")))
    return "Senha fraca. Adicione maiúsculas, números e símbolos.";

  // User already exists — neutral: same message as success to avoid enumeration
  if (msg.includes("already registered") || msg.includes("user already exists"))
    return "Se esse e-mail for válido, você receberá um link em breve.";

  // Session/token expired
  if (msg.includes("expired") || msg.includes("session"))
    return "Link expirado ou inválido. Solicite um novo e tente novamente.";

  // Captcha
  if (msg.includes("captcha") || msg.includes("turnstile"))
    return "Verificação de segurança falhou. Recarregue a página e tente de novo.";

  return "Algo deu errado. Tente novamente.";
}

// ---------------------------------------------------------------------------
// Turnstile widget (client-side only, optional)
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: object) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

function useTurnstile(containerId: string) {
  const siteKey = publicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [token, setToken] = useState<string | undefined>();
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey || typeof window === "undefined") return;

    const container = document.getElementById(containerId);
    if (!container) return;

    function renderWidget() {
      if (!window.turnstile || !container) return;
      widgetIdRef.current = window.turnstile.render(container, {
        sitekey: siteKey,
        theme: "auto",
        callback: (t: string) => setToken(t),
        "expired-callback": () => setToken(undefined),
        "error-callback": () => setToken(undefined),
      });
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      // Load the script if not already loading
      if (!document.querySelector('script[src*="turnstile"]')) {
        const script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
        script.async = true;
        script.onload = renderWidget;
        document.head.appendChild(script);
      } else {
        const interval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(interval);
            renderWidget();
          }
        }, 200);
        return () => clearInterval(interval);
      }
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, containerId]);

  function reset() {
    setToken(undefined);
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }

  return { token, reset, enabled: !!siteKey };
}

// ---------------------------------------------------------------------------
// Individual form wrappers
// ---------------------------------------------------------------------------

function LoginForm({ turnstileContainerId }: { turnstileContainerId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { token: turnstileToken, reset: resetTurnstile, enabled: turnstileEnabled } = useTurnstile(turnstileContainerId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({ resolver: zodResolver(SignInSchema) });

  async function onSubmit(data: SignInInput) {
    if (turnstileEnabled && !turnstileToken) {
      toast.error("Complete a verificação de segurança.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      resetTurnstile();
      toast.error(humanizeError(error));
      return;
    }

    track("login_completed", { method: "email" });
    const rawNext = searchParams.get("next") ?? "";
    // Open-redirect guard: only allow same-origin relative paths
    const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Input
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="seu@email.com"
        error={errors.email?.message}
        {...register("email")}
      />
      <div className="space-y-1">
        <Input
          label="Senha"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />
        <div className="flex justify-end">
          <Link
            href="/recuperar-senha"
            className="text-xs text-brand-500 hover:underline focus-visible:outline-none focus-visible:underline"
          >
            Esqueceu a senha?
          </Link>
        </div>
      </div>

      {turnstileEnabled && (
        <div id={turnstileContainerId} className="min-h-[65px]" aria-label="Verificação de segurança" />
      )}

      <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
        Entrar
      </Button>

      <p className="text-center text-sm text-muted">
        Não tem conta?{" "}
        <Link href="/cadastro" className="text-brand-500 hover:underline">
          Criar conta grátis
        </Link>
      </p>
    </form>
  );
}

// ---------------------------------------------------------------------------

function SignupForm({ turnstileContainerId }: { turnstileContainerId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const { token: turnstileToken, reset: resetTurnstile, enabled: turnstileEnabled } = useTurnstile(turnstileContainerId);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({ resolver: zodResolver(SignUpSchema) });

  const passwordValue = watch("password", "");

  async function onSubmit(data: SignUpInput) {
    if (turnstileEnabled && !turnstileToken) {
      toast.error("Complete a verificação de segurança.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/confirmar`,
      },
    });

    if (error) {
      resetTurnstile();
      // Neutral message: don't reveal whether the e-mail already exists
      toast.error(humanizeError(error));
      // Show success screen regardless to avoid enumeration
    }

    track("signup_completed", { method: "email" });
    setDone(true);
  }

  if (done) {
    return (
      <div className="space-y-3 text-center" role="status" aria-live="polite">
        <p className="text-base font-medium text-fg">Verifique seu e-mail</p>
        <p className="text-sm text-muted">
          Se o endereço informado for válido, você receberá um link de confirmação em
          breve. Não esqueça de checar a pasta de spam.
        </p>
        <Button variant="secondary" size="md" onClick={() => router.push("/login")}>
          Voltar para o login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Input
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="seu@email.com"
        error={errors.email?.message}
        {...register("email")}
      />
      <div className="space-y-2">
        <Input
          label="Senha"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />
        {passwordValue.length > 0 && (
          <PasswordStrengthMeter password={passwordValue} />
        )}
      </div>
      <Input
        label="Confirmar senha"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      {turnstileEnabled && (
        <div id={turnstileContainerId} className="min-h-[65px]" aria-label="Verificação de segurança" />
      )}

      <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
        Criar conta
      </Button>

      <p className="text-center text-sm text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="text-brand-500 hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}

// ---------------------------------------------------------------------------

function ResetForm({ turnstileContainerId }: { turnstileContainerId: string }) {
  const supabase = createClient();
  const { token: turnstileToken, reset: resetTurnstile, enabled: turnstileEnabled } = useTurnstile(turnstileContainerId);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetRequestInput>({ resolver: zodResolver(ResetRequestSchema) });

  async function onSubmit(data: ResetRequestInput) {
    if (turnstileEnabled && !turnstileToken) {
      toast.error("Complete a verificação de segurança.");
      return;
    }

    // Always show success to avoid revealing whether the e-mail is registered
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/confirmar?mode=recovery`,
    });

    resetTurnstile();
    track("password_reset_requested");
    setDone(true);
  }

  if (done) {
    return (
      <div className="space-y-3 text-center" role="status" aria-live="polite">
        <p className="text-base font-medium text-fg">Verifique seu e-mail</p>
        <p className="text-sm text-muted">
          Se houver uma conta com esse endereço, você receberá um link para
          redefinir a senha. Confira também a pasta de spam.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Input
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="seu@email.com"
        error={errors.email?.message}
        {...register("email")}
      />

      {turnstileEnabled && (
        <div id={turnstileContainerId} className="min-h-[65px]" aria-label="Verificação de segurança" />
      )}

      <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
        Enviar link de recuperação
      </Button>

      <p className="text-center text-sm text-muted">
        Lembrou a senha?{" "}
        <Link href="/login" className="text-brand-500 hover:underline">
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}

// ---------------------------------------------------------------------------

function NewPasswordForm() {
  const router = useRouter();
  const supabase = createClient();
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordInput>({ resolver: zodResolver(NewPasswordSchema) });

  const passwordValue = watch("password", "");

  async function onSubmit(data: NewPasswordInput) {
    const { error } = await supabase.auth.updateUser({ password: data.password });

    if (error) {
      toast.error(humanizeError(error));
      return;
    }

    track("signup_completed", { method: "password_reset" });
    setDone(true);
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  if (done) {
    return (
      <div className="space-y-3 text-center" role="status" aria-live="polite">
        <p className="text-base font-medium text-fg">Senha atualizada!</p>
        <p className="text-sm text-muted">Redirecionando para o painel…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-2">
        <Input
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />
        {passwordValue.length > 0 && (
          <PasswordStrengthMeter password={passwordValue} />
        )}
      </div>
      <Input
        label="Confirmar nova senha"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
        Salvar nova senha
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

const TITLES: Record<AuthMode, string> = {
  login:         "Entrar na sua conta",
  signup:        "Criar conta grátis",
  reset:         "Recuperar senha",
  "new-password": "Definir nova senha",
};

const SUBTITLES: Record<AuthMode, string> = {
  login:         "Bem-vindo de volta!",
  signup:        "Comece a usar gratuitamente, sem cartão de crédito.",
  reset:         "Enviaremos um link para redefinir sua senha.",
  "new-password": "Escolha uma senha forte para proteger sua conta.",
};

export function AuthForm({ mode }: AuthFormProps) {
  const containerId = useId().replace(/:/g, "_");
  const turnstileContainerId = `turnstile_${containerId}`;

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="font-display text-2xl font-bold text-fg">{TITLES[mode]}</h1>
        <p className="text-sm text-muted">{SUBTITLES[mode]}</p>
      </div>

      {mode === "login"         && <LoginForm       turnstileContainerId={turnstileContainerId} />}
      {mode === "signup"        && <SignupForm      turnstileContainerId={turnstileContainerId} />}
      {mode === "reset"         && <ResetForm       turnstileContainerId={turnstileContainerId} />}
      {mode === "new-password"  && <NewPasswordForm />}
    </div>
  );
}
