import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Spinner } from "@/components/ui/Spinner";

export const metadata: Metadata = {
  title: "Recuperar senha",
  description: "Redefina sua senha da Praticca por e-mail.",
};

export default function RecuperarSenhaPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
      <AuthForm mode="reset" />
    </Suspense>
  );
}
