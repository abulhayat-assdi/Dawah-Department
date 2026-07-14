-- ============================================================================
-- ADIMS — Course Syllabus PDF Management
--
-- Reuses the existing `resources` table/bucket (resources_bucket.sql already
-- makes the storage bucket public-read). Adds `syllabus_kind` so a course can
-- have up to 3 syllabus PDFs (Quran / General / Dawah class), and opens
-- anonymous SELECT for just those rows so the public academic page can list
-- and link to them without a login.
--
-- Run after schema.sql. Safe to re-run.
-- ============================================================================

alter table public.resources
  add column if not exists syllabus_kind text check (syllabus_kind in ('quran', 'general', 'dawah'));

create index if not exists idx_resources_syllabus on public.resources (course_id, syllabus_kind);

-- Additional permissive SELECT policy: anyone (even anon) may read a
-- resource row that is a syllabus document. The existing res_read policy
-- (auth.uid() is not null) still covers every other authenticated read.
drop policy if exists res_syllabus_public_read on public.resources;
create policy res_syllabus_public_read on public.resources
  for select using (syllabus_kind is not null);

grant select on public.resources to anon;
