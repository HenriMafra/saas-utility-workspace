// Verifica a stack contra o Supabase na nuvem: auth (admin createUser), trigger
// handle_new_user (profile + créditos), e RLS de leitura pública em tools.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(path.join(ROOT, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(url, service, { auth: { persistSession: false } });
const pub = createClient(url, anon, { auth: { persistSession: false } });

const email = `verify_${Math.floor(Date.now() / 1000)}@praticca-verify.com`;
let ok = true;
function check(name, cond, extra = "") { console.log(`${cond ? "✅" : "❌"} ${name}${extra ? " — " + extra : ""}`); if (!cond) ok = false; }

try {
  // 1) RLS leitura pública de tools (chave anon)
  const { data: tools, error: te } = await pub.from("tools").select("slug");
  check("RLS público lê tools", !te && tools && tools.length === 15, te ? te.message : `${tools?.length} ferramentas`);

  // 2) planos legíveis publicamente
  const { data: plans } = await pub.from("plans").select("id");
  check("RLS público lê plans", plans && plans.length === 3, `${plans?.length} planos`);

  // 3) cria usuário (auth) já confirmado
  const { data: created, error: ce } = await admin.auth.admin.createUser({
    email, password: "Teste@12345", email_confirm: true,
  });
  check("auth.admin.createUser", !ce && created?.user?.id, ce ? ce.message : created?.user?.id);
  const uid = created?.user?.id;

  if (uid) {
    // 4) trigger criou profile?
    const { data: prof } = await admin.from("profiles").select("id, plan, is_admin").eq("id", uid).single();
    check("trigger criou profile", !!prof, prof ? `plan=${prof.plan}` : "ausente");
    // 5) trigger creditou bônus?
    const { data: cred } = await admin.from("credits").select("balance").eq("user_id", uid).single();
    check("trigger criou créditos (bônus 20)", cred?.balance === 20, `balance=${cred?.balance}`);
    // 6) RLS: anon NÃO lê profiles de outro usuário
    const { data: leak } = await pub.from("profiles").select("id").eq("id", uid);
    check("RLS bloqueia leitura de profile alheio (anon)", !leak || leak.length === 0, `linhas vistas=${leak?.length ?? 0}`);
    // limpa
    await admin.auth.admin.deleteUser(uid);
    console.log("🧹 usuário de teste removido");
  }
  console.log(ok ? "\n✅ STACK OK contra a nuvem." : "\n⚠️ Há falhas acima.");
  process.exit(ok ? 0 : 1);
} catch (e) {
  console.error("❌", e.message);
  process.exit(1);
}
