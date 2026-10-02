// Aplica o schema (migrations) + seed num Postgres remoto (Supabase) via connection string.
// Uso: node scripts/apply-db.mjs "postgresql://postgres:SENHA@HOST:5432/postgres"
//   (ou defina SUPABASE_DB_URL no ambiente)
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const conn = process.argv[2] || process.env.SUPABASE_DB_URL;
if (!conn) {
  console.error("Faltou a connection string. Uso: node scripts/apply-db.mjs <postgres-uri>");
  process.exit(1);
}

const FILES = ["supabase/migrations/0001_init.sql", "supabase/seed.sql"];

const client = new pg.Client({
  connectionString: conn,
  ssl: { rejectUnauthorized: false },
  // statement timeout generoso p/ DDL
  statement_timeout: 120_000,
});

try {
  await client.connect();
  console.log("Conectado ao Postgres remoto.");
  for (const f of FILES) {
    const sql = readFileSync(path.join(ROOT, f), "utf8");
    process.stdout.write(`Aplicando ${f} ... `);
    await client.query(sql);
    console.log("OK");
  }
  // Verificação
  const tools = await client.query("select count(*)::int as n from public.tools");
  const plans = await client.query("select id, name, price_month_cents from public.plans order by price_month_cents");
  const buckets = await client.query("select id from storage.buckets order by id");
  console.log(`\nVerificação:`);
  console.log(`  tools: ${tools.rows[0].n}`);
  console.log(`  plans: ${plans.rows.map((r) => `${r.id}(${r.price_month_cents})`).join(", ")}`);
  console.log(`  buckets: ${buckets.rows.map((r) => r.id).join(", ") || "(nenhum)"}`);
  console.log("\n✅ Schema + seed aplicados com sucesso.");
} catch (e) {
  console.error("\n❌ Erro ao aplicar:", e.message);
  process.exit(1);
} finally {
  await client.end();
}
