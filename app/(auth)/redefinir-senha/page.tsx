import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Spinner } from "@/components/ui/Spinner";

export const metadata: Metadata = {
  title: "Nova senha",
  description: "Defina uma nova senha para sua conta Praticca.",
};

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
      <AuthForm mode="new-password" />
    </Suspense>
  );
}
