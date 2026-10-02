import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Spinner } from "@/components/ui/Spinner";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse sua conta Praticca.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
