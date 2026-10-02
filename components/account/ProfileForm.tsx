"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ProfileFormProps {
  initialDisplayName: string | null;
  userId: string;
}

export function ProfileForm({ initialDisplayName, userId }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError("O nome não pode ficar em branco.");
      return;
    }
    if (trimmed.length > 60) {
      setError("O nome deve ter no máximo 60 caracteres.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: dbError } = await supabase
        .from("profiles")
        .update({ display_name: trimmed })
        .eq("id", userId);

      if (dbError) throw dbError;

      toast.success("Nome atualizado com sucesso.");
    } catch {
      setError("Não conseguimos salvar as alterações. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardTitle>Informações pessoais</CardTitle>
      <CardDescription className="mt-1 mb-5">
        Altere como seu nome aparece na plataforma.
      </CardDescription>

      <form onSubmit={handleSubmit} noValidate aria-label="Formulário de perfil">
        <div className="space-y-4">
          <Input
            label="Nome de exibição"
            id="display-name"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (error) setError(null);
            }}
            error={error ?? undefined}
            maxLength={60}
            placeholder="Como você quer ser chamado(a)"
          />

          <div className="flex justify-end">
            <Button type="submit" loading={loading} size="md">
              Salvar alterações
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
