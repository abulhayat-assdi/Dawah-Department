-- ============================================================================
-- ADIMS — Staff Quran Class & Dawah Counseling Tracker
--
-- Tracks staff members' OWN scheduled Quran lessons and dawah counseling
-- sessions — distinct from class_logs.counseling_count, which is counseling
-- given by a teacher during a student batch class. Coordinators/super_admin
-- schedule and assign these within their campus(es); the staff member the
-- session belongs to may also update its status/attendance (self-report).
--
-- Run after schema.sql, 01_add_coordinator_role.sql AND
-- 02_coordinator_and_batches.sql. Safe to re-run.
-- ============================================================================

create table if not exists public.staff_quran_sessions (
  id             uuid primary key default gen_random_uuid(),
  staff_id       uuid not null references public.profiles (id) on delete cascade,
  campus_id      uuid not null references public.campuses (id) on delete cascade,
  scheduled_date date not null,
  status         text not null default 'scheduled' check (status in ('scheduled', 'done', 'missed')),
  attendance     boolean not null default false,
  note           text,
  created_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now()
);

create table if not exists public.dawah_counseling_sessions (
  id             uuid primary key default gen_random_uuid(),
  staff_id       uuid not null references public.profiles (id) on delete cascade,
  campus_id      uuid not null references public.campuses (id) on delete cascade,
  session_date   date not null,
  counselee_note text,
  status         text not null default 'scheduled' check (status in ('scheduled', 'done', 'missed')),
  logged_by      uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now()
);

create index if not exists idx_staff_quran_staff on public.staff_quran_sessions (staff_id, scheduled_date);
create index if not exists idx_staff_quran_campus on public.staff_quran_sessions (campus_id);
create index if not exists idx_dawah_sessions_staff on public.dawah_counseling_sessions (staff_id, session_date);
create index if not exists idx_dawah_sessions_campus on public.dawah_counseling_sessions (campus_id);

alter table public.staff_quran_sessions      enable row level security;
alter table public.dawah_counseling_sessions enable row level security;

-- ---- staff_quran_sessions ----
drop policy if exists sqs_read on public.staff_quran_sessions;
create policy sqs_read on public.staff_quran_sessions for select using (auth.uid() is not null);
drop policy if exists sqs_admin on public.staff_quran_sessions;
create policy sqs_admin on public.staff_quran_sessions for all
  using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists sqs_coordinator on public.staff_quran_sessions;
create policy sqs_coordinator on public.staff_quran_sessions for all
  using (public.is_coordinator_of_campus(campus_id))
  with check (public.is_coordinator_of_campus(campus_id));
drop policy if exists sqs_self on public.staff_quran_sessions;
create policy sqs_self on public.staff_quran_sessions for update
  using (staff_id = auth.uid()) with check (staff_id = auth.uid());

-- ---- dawah_counseling_sessions ----
drop policy if exists dcs_read on public.dawah_counseling_sessions;
create policy dcs_read on public.dawah_counseling_sessions for select using (auth.uid() is not null);
drop policy if exists dcs_admin on public.dawah_counseling_sessions;
create policy dcs_admin on public.dawah_counseling_sessions for all
  using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists dcs_coordinator on public.dawah_counseling_sessions;
create policy dcs_coordinator on public.dawah_counseling_sessions for all
  using (public.is_coordinator_of_campus(campus_id))
  with check (public.is_coordinator_of_campus(campus_id));
drop policy if exists dcs_self on public.dawah_counseling_sessions;
create policy dcs_self on public.dawah_counseling_sessions for update
  using (staff_id = auth.uid()) with check (staff_id = auth.uid());
