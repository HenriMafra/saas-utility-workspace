# SaaS Utility Workspace: Multi-Tenant Architecture with Next.js 15, Stripe, and Row-Level Security

**Author:** Henri Mafra  
**License:** MIT License  
**Domain:** Cloud-Native Architecture, Multi-Tenant SaaS Systems, Transactional Billing Engineering  

---

## 1. Overview

SaaS Utility Workspace is a production-grade multi-tenant web platform engineered on **Next.js 15 (App Router, React 19 Server Components)**, **Supabase PostgreSQL with cryptographic Row Level Security (RLS)**, and **Stripe Billing**. The architecture features an idempotent webhook ingestion pipeline and atomic credit quota accounting designed for high-concurrency document processing services.

---

## 2. Idempotent Payment Reconciliation Architecture

Financial webhook deliveries from payment gateways are vulnerable to duplicate dispatches caused by transient network timeouts. To ensure transaction safety, incoming Stripe events pass through an **Idempotent State Gate**:

```sql
CREATE TABLE billing_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL
);
```

### Execution Protocol:
1. Webhook payload signature is verified using the HMAC-SHA256 signing secret.
2. The transaction performs an atomic insert on `billing_webhook_events(event_id)`.
3. If an `ON CONFLICT` collision occurs, execution aborts immediately with status `HTTP 200 OK`, preventing duplicate credit accrual.
4. If unique, user quota balances increment inside an atomic database transaction.

---

## 3. Cryptographic Row Level Security (RLS)

Multi-tenant isolation is enforced at the PostgreSQL kernel level rather than relying on application-level filtering:

```sql
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation Policy" ON user_documents
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 4. Setup and Execution

```bash
# 1. Clone repository
git clone https://github.com/HenriMafra/saas-utility-workspace.git
cd saas-utility-workspace

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and STRIPE_SECRET_KEY

# 4. Start local development server
npm run dev
```

---

## 5. References

- Vercel. (2024). *Next.js 15 Architecture and Server Components Specification*.
- Stripe, Inc. (2024). *Designing Robust Webhook Ingestion Pipelines*.

---

## 6. License

Licensed under the MIT License. Copyright (c) Henri Mafra.
