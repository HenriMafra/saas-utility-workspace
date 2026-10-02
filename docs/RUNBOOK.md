# RUNBOOK — Praticca

Guia operacional de referência rápida. Para decisões de arquitetura, contexto
detalhado e histórico de ADRs, consulte o blueprint completo em
**`../praticca-blueprint`**.

---

## 1. Ambientes

| Ambiente | URL | Branch | Deploy |
|---|---|---|---|
| Local | http://localhost:3000 | qualquer | `npm run dev` |
| Preview | Gerado por PR | feature/* | Cloudflare Pages (automático) |
| Produção | https://praticca.com.br | main | Cloudflare Pages (automático) |

---

## 2. Inicialização local

```bash
# Pré-requisitos: Node 20+, Docker Desktop, Supabase CLI
cp .env.example .env.local   # edite com suas chaves
npm install
supabase start               # sobe Postgres local na porta 54321
supabase db push             # aplica migrations
npm run dev
```

Acesse o painel local do Supabase em **http://localhost:54323**.

---

## 3. Banco de dados

### Migrations

```bash
# Criar uma nova migration
supabase migration new <nome_da_migration>

# Aplicar pendentes
supabase db push

# Reset completo (destrói dados locais)
supabase db reset
```

### Backup (produção)

Backups automáticos diários via painel Supabase (plano Pro). Para backup
manual: `supabase db dump -f backup_$(date +%Y%m%d).sql`.

---

## 4. Deploy

### Cloudflare Pages

- Conecte o repositório GitHub ao projeto Cloudflare Pages.
- Configure as variáveis de ambiente no painel (Settings > Environment Variables).
- O build command é `npm run build`; o output directory é `.next`.
- Descomente os jobs `deploy-preview` e `deploy-prod` em
  `.github/workflows/ci.yml` após a conexão.

### Variáveis obrigatórias em produção

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
RESEND_API_KEY
NEXT_PUBLIC_APP_URL
```

---

## 5. Monitoramento e alertas

| O quê | Onde |
|---|---|
| Erros de servidor | Tabela `error_logs` no Supabase |
| Logs de auditoria admin | Tabela `audit_logs` |
| Jobs em background | Tabela `background_jobs` |
| Webhooks Stripe | Tabela `webhook_events` |
| Status do serviço | /status (página pública) |

---

## 6. Troubleshooting comum

### Erro 500 em route handler

1. Verifique `error_logs` no Supabase Studio.
2. Confira se as variáveis de ambiente estão presentes no Cloudflare Pages.
3. Verifique se a migration mais recente foi aplicada.

### Webhook Stripe não processado

1. Confirme `STRIPE_WEBHOOK_SECRET` no ambiente.
2. Verifique `webhook_events` — o campo `processed` deve ser `true`.
3. Cheque logs do Cloudflare Pages para o endpoint `/api/webhooks/stripe`.

### Usuário não consegue fazer upload

1. Verifique os limites de usage na tabela `usage_counters`.
2. Confira as políticas de Storage do Supabase (bucket `uploads`).
3. Verifique se o plano do usuário tem créditos disponíveis (`credits.balance`).

### Build falha no CI

1. Rode `npm run typecheck` e `npm run lint` localmente.
2. Verifique se todas as variáveis de ambiente de build estão configuradas
   nos secrets do GitHub (Settings > Secrets and variables > Actions).

---

## 7. Gestão de planos e créditos

- Planos definidos na tabela `plans`.
- Créditos debitados via RPC `increment_usage` e tabela `credit_transactions`.
- Para conceder créditos manualmente: use o painel `/admin` ou
  insira diretamente em `credit_transactions` via service-role.

---

## 8. Feature Flags

Flags na tabela `feature_flags` (campos: `key`, `enabled`, `rollout_percent`,
`target`). Para ativar/desativar uma feature:

```sql
UPDATE feature_flags SET enabled = true WHERE key = 'nome_da_feature';
```

---

## 9. Contatos e recursos

- Blueprint e documentação extensa: `../praticca-blueprint`
- ADRs: `docs/adr/`
- CI: `.github/workflows/ci.yml`
- Testes unitários: `tests/unit/`
- Testes de RLS: `tests/rls/README.md`
