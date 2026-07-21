-- ============================================================================
-- ADIMS — Teacher-wise Resource Center
--
-- A private, per-teacher document store (separate from the shared Dawah library
-- in `public.resources`). Each teacher uploads, replaces and deletes ONLY their
-- own files; Super Admins see everything, Campus Coordinators see the resources
-- of teachers in their campus(es).
--
-- Adds:
--   1. `public.teacher_resources` — one row per uploaded document/asset. We keep
--      the storage object key (`file_path`) alongside the public URL so the
--      replace/delete Server Actions can remove the old object and prevent
--      storage bloat.
--   2. The `teacher-resources` storage bucket, capped at 50 MB per file.
--
-- Run AFTER 07_task_submissions.sql. Safe to re-run.
-- ============================================================================

create table if not exists public.teacher_resources (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.profiles (id) on delete cascade,
  -- Campus the resource belongs to (drives the coordinator's read scope and the
  -- admin dashboard's campus filter). Captured from the teacher's campus at
  -- upload time; null when the teacher has no campus assignment.
  campus_id   uuid references public.campuses (id) on delete set null,
  name        text not null,                 -- display name of the document/asset
  comments    text,                          -- optional description / remarks
  file_url    text not null,                 -- public URL in the teacher-resources bucket
  file_path   text not null,                 -- storage object key (for overwrite/delete)
  file_name   text,                          -- original file name
  file_size   bigint,                        -- bytes (backend size guard mirrors the 50 MB cap)
  file_type   text,                          -- MIME type reported by the browser
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_tres_teacher on public.teacher_resources (teacher_id);
create index if not exists idx_tres_campus  on public.teacher_resources (campus_id);

alter table public.teacher_resources enable row level security;

-- super_admin: everything.
drop policy if exists tres_admin on public.teacher_resources;
create policy tres_admin on public.teacher_resources for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- teacher (owner): full CRUD over their own resources only.
drop policy if exists tres_owner on public.teacher_resources;
create policy tres_owner on public.teacher_resources for all
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

-- coordinator: read-only over resources of their campus(es), for the dashboard.
drop policy if exists tres_coordinator_read on public.teacher_resources;
create policy tres_coordinator_read on public.teacher_resources for select
  using (public.is_coordinator_of_campus(campus_id));

-- ----------------------------------------------------------------------------
-- Storage bucket — 50 MB per-file cap (52428800 bytes) enforced at the source.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('teacher-resources', 'teacher-resources', true, 52428800)
on conflict (id) do update set public = true, file_size_limit = 52428800;

drop policy if exists "teacher-resources upload" on storage.objects;
create policy "teacher-resources upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'teacher-resources');

drop policy if exists "teacher-resources read" on storage.objects;
create policy "teacher-resources read" on storage.objects
  for select using (bucket_id = 'teacher-resources');

drop policy if exists "teacher-resources delete" on storage.objects;
create policy "teacher-resources delete" on storage.objects
  for delete to authenticated using (bucket_id = 'teacher-resources');

-- Verify:
--   select id, teacher_id, campus_id, name, file_name, file_size
--   from public.teacher_resources order by created_at desc;
