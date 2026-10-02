import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Spinner } from "@/components/ui/Spinner";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie sua conta grátis na Praticca e acesse ferramentas rápidas para o dia a dia.",
};

export default function CadastroPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
