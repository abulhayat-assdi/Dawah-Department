-- ============================================================================
-- ADIMS — Notice Board
--
-- Coordinator-posted notices shown on every member's dashboard.
-- RLS: everyone authenticated reads; only super_admin writes.
--
-- Safe to re-run.
-- ============================================================================

create table if not exists public.notices (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notices_created on public.notices (created_at desc);

alter table public.notices enable row level security;

drop policy if exists notices_read on public.notices;
create policy notices_read on public.notices
  for select using (auth.uid() is not null);

drop policy if exists notices_admin on public.notices;
create policy notices_admin on public.notices for all
  using (public.is_super_admin()) with check (public.is_super_admin());

drop trigger if exists trg_touch_notices on public.notices;
create trigger trg_touch_notices before update on public.notices
  for each row execute function public.touch_updated_at();
