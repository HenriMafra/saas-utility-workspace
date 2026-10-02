import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/account/ProfileForm";
import { ChangePassword } from "@/components/account/ChangePassword";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";
import { ActiveSessions } from "@/components/account/ActiveSessions";

export const metadata: Metadata = {
  title: "Minha conta",
  description: "Gerencie seu perfil, senha e segurança da conta.",
};

export default async function ContaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar?next=/conta");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, plan, locale")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6" id="main-content">
      <h1 className="mb-1 font-display text-2xl font-bold text-fg">Minha conta</h1>
      <p className="mb-8 text-sm text-muted">
        Gerencie seu perfil, senha e configurações de segurança.
      </p>

      <div className="space-y-6">
        {/* Informações pessoais */}
        <section aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="sr-only">
            Informações pessoais
          </h2>
          <ProfileForm
            userId={user.id}
            initialDisplayName={profile?.display_name ?? null}
          />
        </section>

        {/* Alterar senha */}
        <section aria-labelledby="password-heading">
          <h2 id="password-heading" className="sr-only">
            Alterar senha
          </h2>
          <ChangePassword />
        </section>

        {/* Autenticação em dois fatores */}
        <section aria-labelledby="2fa-heading">
          <h2 id="2fa-heading" className="sr-only">
            Autenticação em dois fatores
          </h2>
          <TwoFactorSetup />
        </section>

        {/* Sessões ativas */}
        <section aria-labelledby="sessions-heading">
          <h2 id="sessions-heading" className="sr-only">
            Sessões ativas
          </h2>
          <ActiveSessions />
        </section>
      </div>
    </main>
  );
}
