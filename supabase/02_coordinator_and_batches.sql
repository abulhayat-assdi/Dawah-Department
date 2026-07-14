-- ============================================================================
-- ADIMS — Step 2 of 2 for the Coordinator role + Campus-scoped batches.
--
-- Run this AFTER 01_add_coordinator_role.sql has succeeded on its own.
--
-- Design: "Shed" was dropped — in this org a Shed IS a Campus, so there is
-- no separate sub-unit. A Coordinator is simply a profile with
-- role = 'coordinator' who is linked to one or more campuses via the
-- existing `teacher_campuses` table (the same table teachers already use —
-- no new assignment table needed). Batches carry their own `campus_id`
-- directly (courses stay campus-agnostic; the same course can run as
-- batches at multiple campuses).
--
-- Safe to re-run.
-- ============================================================================

-- Batches: which campus a batch runs at, + the 4th date (expected end,
-- distinct from the farewell/ceremony date).
alter table public.batches add column if not exists campus_id uuid references public.campuses (id) on delete set null;
alter table public.batches add column if not exists expected_end_date date;

create index if not exists idx_batches_campus on public.batches (campus_id);

-- ============================================================================
-- Helper functions (SECURITY DEFINER so RLS can call them without recursion)
-- ============================================================================
create or replace function public.is_coordinator_of_campus(p_campus uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.teacher_campuses tc
    join public.profiles p on p.id = tc.teacher_id
    where tc.campus_id = p_campus
      and tc.teacher_id = auth.uid()
      and p.role = 'coordinator'
  );
$$;

create or replace function public.is_coordinator_of_batch(p_batch uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.batches b
    join public.teacher_campuses tc on tc.campus_id = b.campus_id
    join public.profiles p on p.id = tc.teacher_id
    where b.id = p_batch
      and tc.teacher_id = auth.uid()
      and p.role = 'coordinator'
  );
$$;

-- ============================================================================
-- course_tracker view: scoped through batches.campus_id directly (not
-- courses.campus_id — courses are campus-agnostic). Dropped and recreated
-- because CREATE OR REPLACE VIEW cannot reorder/rename existing columns.
-- ============================================================================
drop view if exists public.course_tracker;

create view public.course_tracker as
select
  b.id              as batch_id,
  c.id              as course_id,
  c.abbreviation    as course_info,
  c.name            as course_name,
  b.campus_id       as campus_id,
  cam.name          as campus_name,
  b.batch_no,
  b.duration_label,
  b.start_date,
  b.total_classes,
  b.completed_classes,
  greatest(b.total_classes - b.completed_classes, 0) as remaining_classes,
  case when b.total_classes > 0
       then round(100.0 * b.completed_classes / b.total_classes)
       else 0 end   as progress_pct,
  b.midterm_status,
  b.final_status,
  b.status,
  b.expected_end_date,
  b.farewell_date,
  case when b.farewell_date is not null
       then greatest((b.farewell_date - current_date), 0)
       else null end as days_left,
  case when b.completed_classes > 0
         and b.start_date is not null
         and (current_date - b.start_date) > 0
         and b.total_classes > b.completed_classes
       then ceil(
         (b.total_classes - b.completed_classes)::numeric
         * (current_date - b.start_date)::numeric
         / b.completed_classes
       )::int
       else null end as projected_days_left
from public.batches b
join public.courses c    on c.id = b.course_id
left join public.campuses cam on cam.id = b.campus_id;

-- ============================================================================
-- Row Level Security — coordinator write access, scoped by campus
-- ============================================================================
drop policy if exists batches_coordinator on public.batches;
create policy batches_coordinator on public.batches for all
  using (public.is_coordinator_of_campus(campus_id))
  with check (public.is_coordinator_of_campus(campus_id));

drop policy if exists bt_coordinator on public.batch_teachers;
create policy bt_coordinator on public.batch_teachers for all
  using (public.is_coordinator_of_batch(batch_id))
  with check (public.is_coordinator_of_batch(batch_id));

drop policy if exists cl_coordinator on public.class_logs;
create policy cl_coordinator on public.class_logs for all
  using (public.is_coordinator_of_batch(batch_id))
  with check (public.is_coordinator_of_batch(batch_id));

drop policy if exists btp_coordinator on public.batch_topic_progress;
create policy btp_coordinator on public.batch_topic_progress for all
  using (public.is_coordinator_of_batch(batch_id))
  with check (public.is_coordinator_of_batch(batch_id));

drop policy if exists asmt_coordinator on public.assessments;
create policy asmt_coordinator on public.assessments for all
  using (public.is_coordinator_of_batch(batch_id))
  with check (public.is_coordinator_of_batch(batch_id));

drop policy if exists tasks_coordinator on public.tasks;
create policy tasks_coordinator on public.tasks for all
  using (public.is_coordinator_of_campus(campus_id))
  with check (public.is_coordinator_of_campus(campus_id));
