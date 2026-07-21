-- ============================================================================
-- ADIMS — Campus-wise Weekly Routine (ক্যাম্পাস-ওয়াইজ রুটিন)
--
-- One routine record per batch. Each record carries the weekly Quran-class and
-- Dawah-class timings plus the weekdays each class runs on. The public viewer
-- (Teachers / Staff / anyone) reads these to render the glassmorphic weekly
-- grid; only Super Admins and Campus Coordinators may write.
--
-- Day indices: 0 = Saturday … 5 = Thursday (Friday is the weekly holiday and is
-- intentionally omitted from the grid). Stored as int[] so a class can run on
-- several days.
--
-- `campus_id` is denormalised off the batch so RLS and the campus filter never
-- need a join. Run AFTER 07_task_submissions.sql. Safe to re-run.
-- ============================================================================

create table if not exists public.campus_routines (
  id           uuid primary key default gen_random_uuid(),
  -- One routine per batch — upserted on this column from the builder.
  batch_id     uuid not null unique references public.batches (id) on delete cascade,
  -- Denormalised campus for the RLS check and the viewer's campus filter.
  campus_id    uuid references public.campuses (id) on delete set null,
  -- Quran class: start/end time + the weekdays it runs (0=Sat … 5=Thu).
  quran_start  time,
  quran_end    time,
  quran_days   int[] not null default '{}',
  -- Dawah class: start/end time + the weekdays it runs.
  dawah_start  time,
  dawah_end    time,
  dawah_days   int[] not null default '{}',
  note         text,
  updated_by   uuid references public.profiles (id) on delete set null,
  updated_at   timestamptz not null default now()
);

create index if not exists idx_routine_campus on public.campus_routines (campus_id);
create index if not exists idx_routine_batch  on public.campus_routines (batch_id);

alter table public.campus_routines enable row level security;

-- Read: everyone (the viewer is public / view-only for all roles).
drop policy if exists routine_read on public.campus_routines;
create policy routine_read on public.campus_routines for select using (true);

-- Write: super_admin anywhere.
drop policy if exists routine_admin on public.campus_routines;
create policy routine_admin on public.campus_routines for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- Write: coordinator only within their assigned campus.
drop policy if exists routine_coordinator on public.campus_routines;
create policy routine_coordinator on public.campus_routines for all
  using (public.is_coordinator_of_campus(campus_id))
  with check (public.is_coordinator_of_campus(campus_id));

-- Verify:
--   select batch_id, campus_id, quran_start, quran_days, dawah_start, dawah_days
--   from public.campus_routines order by updated_at desc;
