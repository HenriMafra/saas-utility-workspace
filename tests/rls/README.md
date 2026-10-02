# Suíte de Testes de RLS (Row Level Security)

Este diretório contém testes de integração para validar as políticas de
Row Level Security (RLS) do Supabase.

---

## Princípio testado

> Um usuário autenticado **não pode ler registros de outro usuário** nas
> tabelas protegidas por RLS.

### Tabela principal: `tool_runs`

| Cenário | Resultado esperado |
|---|---|
| Usuário A lê seus próprios `tool_runs` | Retorna os registros do usuário A |
| Usuário A tenta ler `tool_runs` do usuário B (user_id diferente) | Retorna **0 linhas** |
| Usuário não autenticado lê `tool_runs` | Retorna **0 linhas** |

O mesmo princípio se aplica a: `credits`, `credit_transactions`,
`subscriptions`, `favorites`, `feedbacks`, `uploaded_files`,
`generated_files`.

---

## Como executar

### Pré-requisitos

```bash
# 1. Instale o Supabase CLI
npm install -g supabase

# 2. Inicie o banco local (requer Docker)
supabase start

# 3. Aplique as migrations
supabase db push
```

### Rodando os testes

```bash
# Rodar apenas a suíte de RLS (requer variáveis locais)
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_ANON_KEY=<anon-key-local> \
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-local> \
npx vitest run tests/rls
```

As chaves locais são exibidas ao rodar `supabase start`.

---

## Estrutura dos testes

Os testes em `policies.spec.ts` seguem o padrão:

1. **Setup via service-role** — criar usuários de teste e inserir dados via
   `createAdminClient()` (bypassa RLS, só para setup).
2. **Ação via anon/user** — executar a query usando o token JWT do usuário
   A tentando acessar dados do usuário B.
3. **Assert** — verificar que o resultado retornado é vazio (`[]` / `null`).
4. **Teardown** — limpar os dados criados no setup.

---

## Variáveis de ambiente necessárias

```
SUPABASE_URL=                  # URL do banco local ou staging
SUPABASE_ANON_KEY=             # chave pública
SUPABASE_SERVICE_ROLE_KEY=     # chave de serviço (só para setup/teardown)
```

---

## Notas

- Estes testes **não rodam no CI padrão** pois exigem Docker + Supabase local.
- O job de CI possui um step comentado (`# RLS tests`) que pode ser habilitado
  em ambientes com suporte a Docker e serviços Supabase.
- Para adicionar novos cenários de RLS, siga o template de `it.skip` em
  `policies.spec.ts` e implemente a lógica real.
