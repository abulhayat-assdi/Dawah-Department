-- ============================================================================
-- ADIMS — Amali (daily spiritual / dawah practice) checklist
--
-- amali_items : the admin-managed list of daily practices.
-- amali_logs  : one row per (teacher, item, day) recording whether it was done.
--
-- RLS mirrors the rest of schema.sql:
--   items  → everyone authed reads, super_admin writes
--   logs   → each member CRUDs only their own rows
--
-- Safe to re-run.
-- ============================================================================

create table if not exists public.amali_items (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  sequence   int  not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.amali_logs (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  item_id    uuid not null references public.amali_items (id) on delete cascade,
  log_date   date not null default current_date,
  done       boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (teacher_id, item_id, log_date)
);

create index if not exists idx_amali_logs_teacher_date
  on public.amali_logs (teacher_id, log_date);

alter table public.amali_items enable row level security;
alter table public.amali_logs  enable row level security;

-- ---- amali_items ----
drop policy if exists amali_items_read on public.amali_items;
create policy amali_items_read on public.amali_items
  for select using (auth.uid() is not null);
drop policy if exists amali_items_admin on public.amali_items;
create policy amali_items_admin on public.amali_items for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- ---- amali_logs ----
drop policy if exists amali_logs_admin_read on public.amali_logs;
create policy amali_logs_admin_read on public.amali_logs for select
  using (public.is_super_admin() or teacher_id = auth.uid());
drop policy if exists amali_logs_self on public.amali_logs;
create policy amali_logs_self on public.amali_logs for all
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
