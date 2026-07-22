-- ============================================================================
-- ADIMS — Syllabus Library (course-independent)
--
-- Replaces the per-course syllabus PDF upload (syllabus.sql's
-- resources.syllabus_kind) with a standalone list the Super Admin manages
-- directly: add a named syllabus entry, upload/replace its PDF, delete it.
-- No link to any course — categories are freeform (e.g. General students,
-- Alem students, Quran — cannot read / moderate / good).
--
-- Run after 13_weekly_lesson_plan.sql. Safe to re-run.
-- ============================================================================

create table if not exists public.syllabus_documents (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  url        text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_syllabus_documents_sort on public.syllabus_documents (sort_order);

alter table public.syllabus_documents enable row level security;

-- Read: public (even anon) — shown on the public academic page.
drop policy if exists syllabus_documents_read on public.syllabus_documents;
create policy syllabus_documents_read on public.syllabus_documents
  for select using (true);
grant select on public.syllabus_documents to anon;

-- Write: Super Admin only.
drop policy if exists syllabus_documents_admin on public.syllabus_documents;
create policy syllabus_documents_admin on public.syllabus_documents for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- Seed the initial categories described by the Super Admin. Skipped if the
-- table already has rows (e.g. re-running this file after seeding).
insert into public.syllabus_documents (title, sort_order)
select v.title, v.sort_order
from (values
  ('জেনারেল শিক্ষার্থী সিলেবাস', 1),
  ('আলেম শিক্ষার্থী সিলেবাস', 2),
  ('কুরআন সিলেবাস (যারা কুরআন পড়তে পারে না)', 3),
  ('কুরআন সিলেবাস (মোটামুটি পড়তে পারে)', 4),
  ('কুরআন সিলেবাস (ভালো পড়তে পারে)', 5)
) as v(title, sort_order)
where not exists (select 1 from public.syllabus_documents);

-- The old course-wise syllabus columns/policy are no longer written to by the
-- app but are left in place (existing uploaded PDFs, if any, are untouched).
-- Drop manually later if you're sure nothing else needs them:
--   alter table public.resources drop column if exists syllabus_kind;
--   drop policy if exists res_syllabus_public_read on public.resources;
