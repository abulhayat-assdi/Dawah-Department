-- ============================================================================
-- ADIMS — Public site content CMS
--
-- A simple key → JSON store powering the public pages (Home, About, Contact)
-- and site identity. The coordinator edits these from /admin/content; the
-- public pages read them. Anonymous visitors may READ; only super_admin writes.
--
-- Safe to re-run.
-- ============================================================================

create table if not exists public.site_content (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

-- Public pages (including logged-out visitors) read content.
drop policy if exists site_content_read on public.site_content;
create policy site_content_read on public.site_content
  for select using (true);

-- Only the coordinator edits content.
drop policy if exists site_content_admin on public.site_content;
create policy site_content_admin on public.site_content for all
  using (public.is_super_admin()) with check (public.is_super_admin());

grant select on public.site_content to anon;

drop trigger if exists trg_touch_site_content on public.site_content;
create trigger trg_touch_site_content before update on public.site_content
  for each row execute function public.touch_updated_at();

-- Seed default rows (kept empty; the app supplies default copy via lib/content.ts).
insert into public.site_content (key, value) values
  ('site',       '{}'::jsonb),
  ('home',       '{}'::jsonb),
  ('about',      '{}'::jsonb),
  ('academic',   '{}'::jsonb),
  ('contact',    '{}'::jsonb),
  ('activities', '{}'::jsonb),
  ('faculty',    '{}'::jsonb)
on conflict (key) do nothing;
