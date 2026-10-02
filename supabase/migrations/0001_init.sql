-- Praticca — initial schema, RLS and triggers.
-- Run with: supabase db push  (or paste in the Supabase SQL editor)

create extension if not exists "pgcrypto";

-- ============ ENUMS ============
do $$ begin
  create type plan_tier as enum ('free','pro','business');
exception when duplicate_object then null; end $$;
do $$ begin
  create type run_status as enum ('created','uploading','queued','running','completed','failed','cancelled','expired');
exception when duplicate_object then null; end $$;
do $$ begin
  create type job_status as enum ('pending','running','completed','failed','retrying','expired','cancelled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type pay_status as enum ('pending','succeeded','failed','refunded');
exception when duplicate_object then null; end $$;

-- ============ HELPERS ============
create or replace function is_admin() returns boolean language plpgsql stable as $$
begin
  return coalesce((select is_admin from public.profiles where id = auth.uid()), false);
end; $$;

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ============ PROFILES ============
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  plan plan_tier not null default 'free',
  locale text not null default 'pt-BR',
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table profiles is 'Perfil do usuário; espelha auth.users.';
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- Create a profile automatically on signup.
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  insert into public.credits (user_id, balance) values (new.id, 20) on conflict do nothing;
  return new;
end; $$;
drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

create table if not exists user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'system',
  email_notifications boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ============ CATALOG ============
create table if not exists tool_categories (
  slug text primary key, name text not null, description text, sort_order int not null default 0
);
create table if not exists tools (
  slug text primary key,
  name text not null,
  category text not null references tool_categories(slug),
  status text not null default 'active',
  processing_mode text not null default 'client',
  is_premium boolean not null default false,
  credit_cost int not null default 0,
  config jsonb not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ============ EXECUTIONS & FILES ============
create table if not exists tool_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anon_id text,
  tool_slug text not null references tools(slug),
  status run_status not null default 'created',
  options jsonb not null default '{}',
  progress int not null default 0,
  credits_spent int not null default 0,
  cost_estimate_cents int not null default 0,
  duration_ms int,
  error_code text,
  ip_hash text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz
);
create index if not exists idx_tool_runs_user on tool_runs (user_id, created_at desc);
create index if not exists idx_tool_runs_tool on tool_runs (tool_slug, status);
create index if not exists idx_tool_runs_expires on tool_runs (expires_at) where expires_at is not null;

create table if not exists uploaded_files (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references tool_runs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  storage_path text not null, mime text, size_bytes bigint,
  created_at timestamptz not null default now(), expires_at timestamptz
);
create table if not exists generated_files (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references tool_runs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  storage_path text not null, mime text, size_bytes bigint,
  created_at timestamptz not null default now(), expires_at timestamptz
);
create index if not exists idx_generated_user on generated_files (user_id, created_at desc);
create index if not exists idx_generated_expires on generated_files (expires_at);

-- ============ USAGE / LIMITS ============
create table if not exists usage_counters (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  tool_slug text not null,
  "window" text not null,
  period_key text not null,
  count int not null default 0,
  unique (subject, tool_slug, "window", period_key)
);

-- Atomically increment and return the new count.
create or replace function increment_usage(p_subject text, p_tool text, p_window text, p_period text)
returns int language plpgsql security definer set search_path = public as $$
declare v int;
begin
  insert into usage_counters(subject,tool_slug,"window",period_key,count)
  values (p_subject,p_tool,p_window,p_period,1)
  on conflict (subject,tool_slug,"window",period_key)
  do update set count = usage_counters.count + 1
  returning count into v;
  return v;
end; $$;

-- ============ BILLING ============
create table if not exists plans (
  id text primary key, name text not null, tier plan_tier not null,
  price_month_cents int not null default 0, price_year_cents int not null default 0,
  monthly_credits int not null default 0, config jsonb not null default '{}'
);
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null references plans(id),
  status text not null,
  provider text not null default 'stripe',
  provider_subscription_id text unique,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz not null default now(), updated_at timestamptz default now()
);
create index if not exists idx_subs_user on subscriptions (user_id);
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  subscription_id uuid references subscriptions(id),
  provider text not null default 'stripe',
  provider_payment_id text unique,
  amount_cents int not null, currency text not null default 'BRL',
  status pay_status not null default 'pending', method text,
  created_at timestamptz not null default now()
);
create table if not exists credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance int not null default 0, updated_at timestamptz default now()
);
create table if not exists credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta int not null, reason text not null, run_id uuid references tool_runs(id),
  balance_after int not null, created_at timestamptz not null default now()
);
create index if not exists idx_credit_tx_user on credit_transactions (user_id, created_at desc);
create table if not exists coupons (
  code text primary key, kind text not null, value int not null,
  applies_to text, max_uses int, used_count int not null default 0,
  valid_until timestamptz, active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============ FAVORITES / HISTORY / FEEDBACK ============
create table if not exists favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_slug text not null references tools(slug),
  created_at timestamptz not null default now(),
  primary key (user_id, tool_slug)
);
create table if not exists feedbacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  tool_slug text, run_id uuid, rating int, comment text,
  context jsonb, resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============ OBSERVABILITY / ADMIN ============
create table if not exists error_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null, category text not null,
  tool_slug text, user_id uuid, run_id uuid,
  request_id text, correlation_id text,
  friendly_message text, technical_message text, stack text,
  duration_ms int, cost_estimate_cents int, api_used text,
  recommended_action text, resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_error_created on error_logs (created_at desc);
create index if not exists idx_error_cat on error_logs (category, level);
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null, action text not null, entity text, entity_id text,
  before jsonb, after jsonb, reason text, ip text, user_agent text,
  result text not null default 'ok', error text,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_admin on audit_logs (admin_id, created_at desc);
create table if not exists app_settings (key text primary key, value jsonb not null, updated_at timestamptz default now());
create table if not exists feature_flags (
  key text primary key, enabled boolean not null default false,
  rollout_percent int not null default 0, target jsonb not null default '{}',
  updated_at timestamptz default now()
);
create table if not exists background_jobs (
  id uuid primary key default gen_random_uuid(),
  type text not null, status job_status not null default 'pending',
  priority int not null default 0, attempts int not null default 0, max_attempts int not null default 3,
  payload jsonb, result jsonb, user_id uuid, tool_slug text, error text,
  created_at timestamptz not null default now(), completed_at timestamptz
);
create table if not exists webhook_events (
  id text primary key, provider text not null, type text,
  processed boolean not null default false, payload jsonb,
  created_at timestamptz not null default now()
);
create table if not exists seo_pages (
  slug text primary key, title text, description text, h1 text,
  content text, faq jsonb, canonical text, noindex boolean default false,
  og_image text, schema jsonb, updated_at timestamptz default now()
);
create table if not exists blog_posts (
  slug text primary key, title text not null, excerpt text, body text,
  cluster text, keyword text, published boolean not null default false,
  published_at timestamptz, created_at timestamptz not null default now()
);

-- ============ RLS ============
alter table profiles enable row level security;
alter table user_preferences enable row level security;
alter table tool_runs enable row level security;
alter table uploaded_files enable row level security;
alter table generated_files enable row level security;
alter table credits enable row level security;
alter table credit_transactions enable row level security;
alter table subscriptions enable row level security;
alter table payments enable row level security;
alter table favorites enable row level security;
alter table feedbacks enable row level security;
alter table error_logs enable row level security;
alter table audit_logs enable row level security;
alter table app_settings enable row level security;
alter table feature_flags enable row level security;

-- public catalog is readable by anyone
alter table tools enable row level security;
alter table tool_categories enable row level security;
alter table plans enable row level security;
alter table seo_pages enable row level security;
alter table blog_posts enable row level security;
create policy pub_tools on tools for select using (true);
create policy pub_cats on tool_categories for select using (true);
create policy pub_plans on plans for select using (true);
create policy pub_seo on seo_pages for select using (true);
create policy pub_blog on blog_posts for select using (published or is_admin());

-- profiles
create policy profiles_select on profiles for select using (auth.uid() = id or is_admin());
create policy profiles_update on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
-- preferences
create policy prefs_all on user_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- tool_runs
create policy tr_select on tool_runs for select using (auth.uid() = user_id or is_admin());
create policy tr_insert on tool_runs for insert with check (auth.uid() = user_id or user_id is null);
-- files (read own; writes happen via service_role server-side)
create policy uf_select on uploaded_files for select using (auth.uid() = user_id or is_admin());
create policy gf_select on generated_files for select using (auth.uid() = user_id or is_admin());
-- credits / billing (read own; writes via service_role)
create policy credits_select on credits for select using (auth.uid() = user_id or is_admin());
create policy ct_select on credit_transactions for select using (auth.uid() = user_id or is_admin());
create policy subs_select on subscriptions for select using (auth.uid() = user_id or is_admin());
create policy pay_select on payments for select using (auth.uid() = user_id or is_admin());
-- favorites / feedback
create policy fav_all on favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy fb_insert on feedbacks for insert with check (auth.uid() = user_id or user_id is null);
create policy fb_select on feedbacks for select using (auth.uid() = user_id or is_admin());
-- admin-only tables
create policy el_admin on error_logs for select using (is_admin());
create policy al_admin on audit_logs for select using (is_admin());
create policy settings_admin on app_settings for select using (is_admin());
create policy flags_read on feature_flags for select using (true);
