/**
 * Testes de RLS (Row Level Security) — esqueleto skipável.
 *
 * Para executar de verdade:
 *   1. Suba o Supabase local: `supabase start`
 *   2. Configure as variáveis de ambiente (ver README.md)
 *   3. Remova os `it.skip` e implemente a lógica de setup/teardown
 *
 * @see tests/rls/README.md
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Helpers de ambiente — lidos em runtime para não quebrar o CI.
// ---------------------------------------------------------------------------
function getEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Env var ${key} not set. See tests/rls/README.md`);
  return val;
}

// ---------------------------------------------------------------------------
// Variáveis compartilhadas entre os testes
// ---------------------------------------------------------------------------
let adminClient: SupabaseClient;
let userAClient: SupabaseClient;

const TEST_TAG = `rls_test_${Date.now()}`;

// ---------------------------------------------------------------------------
// Setup global — só roda se as variáveis estiverem presentes
// ---------------------------------------------------------------------------
beforeAll(async () => {
  // Skipa silenciosamente se não há ambiente configurado
  if (!process.env.SUPABASE_URL) return;

  adminClient = createClient(
    getEnv("SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } }
  );

  // Cria usuário A via Admin API e obtém token JWT para simular sessão
  // (implementação real usa supabase.auth.admin.createUser + signInWithPassword)
  userAClient = createClient(
    getEnv("SUPABASE_URL"),
    getEnv("SUPABASE_ANON_KEY"),
    { auth: { persistSession: false } }
  );
});

// ---------------------------------------------------------------------------
// Teardown global
// ---------------------------------------------------------------------------
afterAll(async () => {
  if (!adminClient) return;
  // Limpa dados de teste inseridos com a tag TEST_TAG
  // await adminClient.from("tool_runs").delete().eq("options->_test_tag", TEST_TAG);
});

// ---------------------------------------------------------------------------
// tool_runs
// ---------------------------------------------------------------------------
describe("RLS: tool_runs", () => {
  it.skip(
    "usuário A não vê tool_runs do usuário B",
    async () => {
      /**
       * Implementação:
       *
       * 1. Via adminClient, inserir uma tool_run com user_id = userB.id
       * 2. Via userAClient (autenticado como usuário A), fazer SELECT em tool_runs
       *    filtrando pela ID do registro inserido
       * 3. Esperar que o resultado seja [] (zero linhas)
       *
       * const { data } = await userAClient
       *   .from("tool_runs")
       *   .select("id")
       *   .eq("id", runCreatedByB.id);
       *
       * expect(data).toHaveLength(0);
       */
      expect(true).toBe(true); // placeholder — remova quando implementar
    }
  );

  it.skip(
    "usuário A vê somente seus próprios tool_runs",
    async () => {
      /**
       * Implementação:
       *
       * 1. Via adminClient, inserir tool_runs para usuário A e usuário B
       * 2. Via userAClient, SELECT em tool_runs sem filtro (RLS aplica automaticamente)
       * 3. Todos os registros retornados devem ter user_id === userA.id
       *
       * const { data } = await userAClient.from("tool_runs").select("user_id");
       * const foreignRuns = data?.filter(r => r.user_id !== userA.id) ?? [];
       * expect(foreignRuns).toHaveLength(0);
       */
      expect(true).toBe(true); // placeholder
    }
  );

  it.skip(
    "usuário não autenticado recebe 0 linhas de tool_runs",
    async () => {
      /**
       * Implementação:
       *
       * const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
       * // Sem chamar signIn — cliente não autenticado
       * const { data, error } = await anonClient.from("tool_runs").select("id").limit(10);
       * expect(data).toHaveLength(0);
       */
      expect(true).toBe(true); // placeholder
    }
  );
});

// ---------------------------------------------------------------------------
// credits
// ---------------------------------------------------------------------------
describe("RLS: credits", () => {
  it.skip(
    "usuário A não vê saldo de créditos do usuário B",
    async () => {
      /**
       * Implementação similar à de tool_runs.
       * Inserir crédito para usuário B via adminClient, tentar ler via userAClient.
       * Esperar 0 linhas.
       */
      expect(true).toBe(true);
    }
  );
});

// ---------------------------------------------------------------------------
// subscriptions
// ---------------------------------------------------------------------------
describe("RLS: subscriptions", () => {
  it.skip(
    "usuário A não vê assinatura do usuário B",
    async () => {
      expect(true).toBe(true);
    }
  );
});

// ---------------------------------------------------------------------------
// uploaded_files / generated_files
// ---------------------------------------------------------------------------
describe("RLS: arquivos", () => {
  it.skip(
    "usuário A não vê uploaded_files do usuário B",
    async () => {
      expect(true).toBe(true);
    }
  );

  it.skip(
    "usuário A não vê generated_files do usuário B",
    async () => {
      expect(true).toBe(true);
    }
  );
});
