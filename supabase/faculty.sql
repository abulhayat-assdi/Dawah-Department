-- ============================================================================
-- ADIMS — Public Faculty list (CMS-managed, separate from member accounts)
--
-- Shown on the public Faculty page and its profile pages. Anonymous visitors
-- read; only super_admin writes. Photos use the existing `avatars` bucket.
--
-- Safe to re-run.
-- ============================================================================

create table if not exists public.faculty (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  designation text,
  photo_url   text,
  background  text,            -- ঐতিহাসিক পটভূমি
  location    text,            -- জন্মস্থান
  bio         text,            -- সম্পূর্ণ বায়োডাটা (rich HTML)
  featured    boolean not null default false,
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);

-- For existing databases created before these columns were added:
alter table public.faculty add column if not exists background text;
alter table public.faculty add column if not exists location text;

create index if not exists idx_faculty_sort on public.faculty (sort, created_at);

alter table public.faculty enable row level security;

drop policy if exists faculty_read on public.faculty;
create policy faculty_read on public.faculty for select using (true);

drop policy if exists faculty_admin on public.faculty;
create policy faculty_admin on public.faculty for all
  using (public.is_super_admin()) with check (public.is_super_admin());

grant select on public.faculty to anon;
