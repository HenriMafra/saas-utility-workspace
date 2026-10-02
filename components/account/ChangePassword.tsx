"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function ChangePassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  function validate() {
    const errs: typeof errors = {};
    if (password.length < 8) {
      errs.password = "A senha deve ter pelo menos 8 caracteres.";
    } else if (!/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
      errs.password = "Inclua pelo menos um número e um símbolo (ex.: @#$).";
    }
    if (password !== confirm) {
      errs.confirm = "As senhas não coincidem.";
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success("Senha alterada com sucesso.");
      setPassword("");
      setConfirm("");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Não conseguimos alterar a senha. Tente novamente.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardTitle>Alterar senha</CardTitle>
      <CardDescription className="mt-1 mb-5">
        Escolha uma senha forte com letras, números e símbolos.
      </CardDescription>

      <form onSubmit={handleSubmit} noValidate aria-label="Formulário de alteração de senha">
        <div className="space-y-4">
          <Input
            label="Nova senha"
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={errors.password}
            placeholder="Mínimo 8 caracteres"
          />

          <Input
            label="Confirmar nova senha"
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (errors.confirm) setErrors((prev) => ({ ...prev, confirm: undefined }));
            }}
            error={errors.confirm}
            placeholder="Repita a nova senha"
          />

          <div className="flex justify-end">
            <Button type="submit" loading={loading} size="md">
              Alterar senha
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
