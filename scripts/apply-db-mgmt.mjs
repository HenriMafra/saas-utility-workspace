// Aplica schema + seed via Supabase Management API (sem precisar da senha do banco).
// Usa o access token do CLI (env SUPABASE_ACCESS_TOKEN) e o project ref (arg).
// Uso: SUPABASE_ACCESS_TOKEN=... node scripts/apply-db-mgmt.mjs <project-ref>
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ref = process.argv[2];
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!ref || !token) {
  console.error("Faltou ref ou SUPABASE_ACCESS_TOKEN.");
  process.exit(1);
}

const API = `https://api.supabase.com/v1/projects/${ref}/database/query`;

async function runSql(label, sql) {
  process.stdout.write(`Aplicando ${label} ... `);
  const res = await fetch(API, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.log("FALHOU");
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
  }
  console.log("OK");
  return text;
}

try {
  await runSql("migrations/0001_init.sql", readFileSync(path.join(ROOT, "supabase/migrations/0001_init.sql"), "utf8"));
  await runSql("seed.sql", readFileSync(path.join(ROOT, "supabase/seed.sql"), "utf8"));
  const verify = await runSql(
    "verificação",
    "select (select count(*) from public.tools) as tools, (select count(*) from public.plans) as plans, (select count(*) from storage.buckets) as buckets;",
  );
  console.log("Resultado:", verify);
  console.log("\n✅ Schema + seed aplicados via Management API.");
} catch (e) {
  console.error("\n❌", e.message);
  process.exit(1);
}
