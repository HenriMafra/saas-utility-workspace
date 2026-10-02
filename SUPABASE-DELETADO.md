# Praticca — Supabase arquivado

**Data de exclusão:** 2026-06-29  
**Projeto Supabase ref:** `mjxpiymwvtruwaskwbjd`  
**Org:** MedFlow (`jneiegkmktnxwgwfynzt`)  
**Região:** us-west-2  
**Status no momento da exclusão:** INACTIVE (pausado — plano Free, sem uso ativo)  

## Por que foi excluído
Consolidação dos projetos Supabase: apenas 2 projetos ativos no plano Free
(`atlas-b2g-medflow` e `repartition`). Praticca está em fase de blueprint/desenvolvimento,
sem usuários em produção.

## Schema
O schema estava definido nas migrations/código do projeto (pasta `lib/supabase/`).
Principais entidades conhecidas: usuários/perfis (Supabase Auth), ferramentas (hub de 15 tools),
sessões, configurações por tool, billing (Stripe).

## Como recriar o projeto Supabase
1. Criar novo projeto em https://supabase.com/dashboard
2. Atualizar `.env.local` com as novas chaves:
   - `NEXT_PUBLIC_SUPABASE_URL=https://SEU-NOVO-REF.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
   - `SUPABASE_SERVICE_ROLE_KEY=...`
3. Rodar as migrations/scripts SQL que estiverem em `lib/supabase/` ou `supabase/`
4. Rodar `npm run create-admin` para criar o usuário admin inicial

## Referências
- Código da aplicação: completo neste repositório (`HenriMafra/praticca`)
- Blueprint do projeto: `Desktop/praticca-blueprint/`
- Documentação de setup: `docs/` neste repo
- Último commit antes da exclusão do Supabase: ver `git log --oneline -5`
