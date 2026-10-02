// Cria (ou atualiza) um usuário admin já confirmado, via service_role.
// Uso: node scripts/create-admin.mjs <email> <senha>
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(path.join(ROOT, ".env.local"), "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const email = process.argv[2];
const password = process.argv[3];
if (!email || !password) { console.error("Uso: node scripts/create-admin.mjs <email> <senha>"); process.exit(1); }

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// cria (ou recupera se já existir)
let uid;
const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (error) {
  if (/already/i.test(error.message)) {
    const { data: list } = await admin.auth.admin.listUsers();
    uid = list.users.find((u) => u.email === email)?.id;
    if (uid) await admin.auth.admin.updateUserById(uid, { password, email_confirm: true });
    console.log("usuário já existia — senha redefinida");
  } else { console.error("❌", error.message); process.exit(1); }
} else { uid = data.user.id; console.log("usuário criado"); }

// promove a admin + créditos generosos para testes
await admin.from("profiles").update({ is_admin: true, display_name: "Admin" }).eq("id", uid);
await admin.from("credits").upsert({ user_id: uid, balance: 1000 });
console.log(`\n✅ Admin pronto:\n   email: ${email}\n   senha: ${password}\n   is_admin: true · créditos: 1000`);
