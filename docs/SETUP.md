# Setup — Praticca (Supabase, Stripe, Cloudflare)

Guia passo a passo para sair do build local (placeholders) para um ambiente funcional.
Variáveis vão em `.env.local` (já existe com placeholders; veja `.env.example`).

> Pré-requisitos detectados nesta máquina: Supabase CLI 2.98, Wrangler 4.87, Node 24. Stripe CLI **não** instalado (use o dashboard).

---

## 1. Supabase (auth, banco, storage)

1. Crie um projeto em https://supabase.com/dashboard → anote a **Project URL** e as chaves em *Settings → API*.
2. Preencha em `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJ.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public>
   SUPABASE_SERVICE_ROLE_KEY=<service_role secret>   # NUNCA exponha no client
   ```
3. **Aplique o schema** (escolha A ou B):
   - **A) Supabase CLI** (recomendado):
     ```bash
     supabase login
     supabase link --project-ref SEU-PROJ-REF
     supabase db push           # aplica supabase/migrations/0001_init.sql
     # seed (dados de catálogo: categorias, 15 tools, planos, settings, flags):
     supabase db execute --file supabase/seed.sql
     ```
   - **B) SQL Editor** (sem CLI): cole e rode `supabase/migrations/0001_init.sql` e depois `supabase/seed.sql`.
4. **Storage**: em *Storage*, crie 2 buckets **privados**: `uploads` e `generated`. (Sem leitura pública — o app usa URLs assinadas.)
5. **Auth**: *Authentication → Providers* → habilite **Email**; (opcional) **Google**. Em *URL Configuration*, defina Site URL `http://localhost:3000` e o domínio de produção. Habilite **MFA (TOTP)** em *Authentication → MFA*.
6. **Vire admin**: após criar sua conta no app, rode no SQL editor:
   ```sql
   update profiles set is_admin = true where id = (select id from auth.users where email = 'voce@exemplo.com');
   ```
   (ou use `ADMIN_ALLOWED_EMAILS` no `.env.local` para o bootstrap.)

✅ Depois disso: login/cadastro, dashboard, histórico, favoritos e admin funcionam.

---

## 2. Stripe (pagamentos — cartão + Pix)

1. Conta em https://dashboard.stripe.com (modo **test** primeiro). Em BRL.
2. **Products → Prices**: crie 2 produtos com preço **recorrente mensal e anual**:
   - Pro: R$ 19,90/mês e R$ 199/ano · Business: R$ 49,90/mês e R$ 499/ano.
   - Copie os 4 `price_...` para o `.env.local`:
     ```
     STRIPE_PRICE_PRO_MONTH=price_... STRIPE_PRICE_PRO_YEAR=price_...
     STRIPE_PRICE_BUSINESS_MONTH=price_... STRIPE_PRICE_BUSINESS_YEAR=price_...
     ```
3. Chaves (*Developers → API keys*):
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
4. **Pix**: *Settings → Payment methods* → ative **Pix** (BR).
5. **Webhook**: *Developers → Webhooks → Add endpoint*:
   - URL: `https://SEU-DOMINIO/api/webhooks/stripe`
   - Eventos: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`.
   - Copie o *Signing secret* → `STRIPE_WEBHOOK_SECRET=whsec_...`
   - Teste local: como o Stripe CLI não está instalado, use o dashboard (*Send test webhook*) ou instale o CLI e rode `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

✅ Depois: checkout em `/precos` libera o plano via webhook (idempotente) e credita os créditos do mês.

---

## 3. Demais serviços (opcionais por recurso)

| Recurso | Variáveis | Onde |
|---|---|---|
| **Assistente IA** | `AI_PROVIDER_API_KEY` | console.anthropic.com (a rota usa `claude-haiku-4-5`) |
| **OCR no servidor** | `OCR_SERVER_ENABLED=true` + deploy da function | (OCR client já funciona sem nada) |
| **Turnstile** (antiabuso) | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | dash.cloudflare.com → Turnstile |
| **E-mail** | `RESEND_API_KEY`, `EMAIL_FROM` | resend.com (verifique o domínio: SPF/DKIM) |
| **Erros** | `NEXT_PUBLIC_SENTRY_DSN` | sentry.io |
| **Analytics** | `NEXT_PUBLIC_ANALYTICS_DOMAIN` | Plausible/Umami (sem cookies, LGPD-friendly) |

---

## 4. Edge Functions (Supabase)

```bash
supabase functions deploy limpar-expirados
supabase functions deploy health-check
supabase functions deploy webhook-pagamento
supabase functions deploy gerar-sitemap
# processar-ocr e remover-fundo são pontos de integração (placeholders honestos) — deploy quando integrar o modelo/serviço.
```
Agende os crons em *Database → Cron* (ex.: `limpar-expirados` a cada hora; `health-check` a cada 5 min).

---

## 5. Rodar e publicar

**Local:**
```bash
npm install
npm run dev        # http://localhost:3000
```
**Verificações:** `npm run typecheck` · `npm run build` · `npm test` · `npm run e2e` (precisa de `npm run build` antes).

**Deploy — duas opções:**
- **Vercel (imediato, zero config):** importe o repo `HenriMafra/praticca`, defina as env vars, deploy. Funciona com este código como está.
- **Cloudflare Workers (stack alvo — JÁ CONFIGURADO via OpenNext):** o adaptador `@opennextjs/cloudflare` está integrado (`wrangler.jsonc`, `open-next.config.ts`, `nodejs_compat`). Comandos:
  ```bash
  npm run cf:preview   # build + roda no runtime do Cloudflare (workerd) localmente
  wrangler login
  npm run cf:deploy    # build + deploy do Worker
  ```
  Defina os secrets no Cloudflare (nunca commitados):
  ```bash
  npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
  npx wrangler secret put STRIPE_SECRET_KEY
  npx wrangler secret put STRIPE_WEBHOOK_SECRET
  npx wrangler secret put RESEND_API_KEY
  npx wrangler secret put AI_PROVIDER_API_KEY
  npx wrangler secret put TURNSTILE_SECRET_KEY
  ```
  Vars públicas (`NEXT_PUBLIC_*`) entram como *vars* no `wrangler.jsonc`/painel. Páginas SSG (ferramentas, categorias, blog) são servidas pelo *static-assets incremental cache* (sem R2/KV). Para ISR no futuro, troque por `r2-incremental-cache` + binding `NEXT_INC_CACHE_R2_BUCKET`. Verificado: todas as rotas retornam 200 no workerd.

---

## Checklist de "primeiro ambiente real"
- [ ] `.env.local` com Supabase (URL + anon + service_role)
- [ ] `supabase db push` + `seed.sql` aplicados
- [ ] buckets privados `uploads` e `generated`
- [ ] sua conta marcada `is_admin = true`
- [ ] Stripe: 4 price IDs + chaves + webhook + Pix ativo
- [ ] `npm run dev` → criar conta → comprimir um PDF → assinar Pro (test) → ver plano no `/dashboard`
