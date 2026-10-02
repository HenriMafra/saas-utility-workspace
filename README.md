# 🛠️ SaaS Utility Workspace — Plataforma Multi-Ferramentas com Next.js 15, Stripe & Supabase

Plataforma SaaS multi-ferramentas (processamento de documentos, conversão de arquivos e utilitários de produtividade digital), construída com arquitetura de ponta baseada em **Next.js 15 (App Router, React 19)**, **Supabase Auth & Database**, checkout global e webhooks idempotentes do **Stripe**, e sistema flexível de **cotas de créditos por usuário**.

---

## 📌 Que Problema Resolve?

Muitos projetos SaaS falham na infraestrutura de monetização: lidar com controle de acesso, limites de requisições, idempotência de webhooks de pagamento (para evitar que uma queda de conexão credite duas vezes um plano) e escalabilidade de micro-ferramentas utilitárias.

O **SaaS Utility Workspace** foi projetado como uma fundação pronta para produção:
1. **Controle de Saldo e Créditos:** Cada usuário possui um saldo de créditos decrementado atomicamente a cada processamento de documento.
2. **Integração Completa com Stripe:** Planos recorrentes (Pro, Business) e pacotes avulsos de recarga com reconciliação assíncrona de webhooks.
3. **Arquitetura Modular:** Novas ferramentas utilitárias podem ser plugadas com uma única rota e schema de validação Zod.

---

## ⚙️ Diferencial Técnico & Arquitetura

- **Next.js 15 App Router & Server Actions:** Máxima segurança com execução de lógica de billing no servidor.
- **Idempotência de Pagamento:** Chaves de idempotência na tabela `billing_events` para garantir que webhooks repetidos do Stripe nunca gerem créditos duplicados.
- **Row Level Security (RLS):** Isolamento criptográfico de dados no Supabase garantindo que nenhum usuário acesse documentos ou créditos de terceiros.

---

## 🏗️ Stack Tecnológica

- **Frontend & Fullstack:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons.
- **Pagamentos:** Stripe API (Stripe Checkout & Webhooks assinados).
- **Backend & Auth:** Supabase (PostgreSQL, Auth com Magic Link e OAuth).
- **E-mails Transacionais:** Resend API.
- **Testes:** Playwright (testes ponta a ponta de fluxos críticos de assinatura).

---

## 🚀 Como Executar Localmente

```bash
# 1. Clone o repositório
git clone https://github.com/HenriMafra/saas-utility-workspace.git
cd saas-utility-workspace

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Preencha NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e STRIPE_SECRET_KEY

# 4. Inicie o servidor
npm run dev
```

---

## 📄 Licença

Distribuído sob a licença **MIT**. Desenvolvido por **Henri Mafra**.
