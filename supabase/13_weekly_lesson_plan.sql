-- ============================================================================
-- ADIMS — Weekly Lesson Plan (উইকলি লেসন প্ল্যান)
--
-- Separate from Campus-wise Routine (campus_routines): teachers submit a
-- weekly teaching agenda per batch; Super Admins / Campus Coordinators audit
-- those submissions across teachers and campuses.
--
-- batch_teachers is a flat, permanent teacher↔batch link with no month
-- dimension, but the spec requires the batch dropdown to be scoped to
-- "batches assigned to the teacher for the selected month". This file adds a
-- real monthly allocation (lesson_plan_assignments), admin/coordinator
-- managed, drawn from a teacher's existing batch_teachers rows — mirroring
-- how tasks.target_month already works for the class-quota feature.
--
-- Run AFTER 12_feedback_open_read.sql. Safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- lesson_plan_assignments: which batches a teacher may plan for, per month.
-- ----------------------------------------------------------------------------
create table if not exists public.lesson_plan_assignments (
  id            uuid primary key default gen_random_uuid(),
  teacher_id    uuid not null references public.profiles (id) on delete cascade,
  batch_id      uuid not null references public.batches (id) on delete cascade,
  -- Denormalised from the batch for RLS + campus filters (no join needed).
  campus_id     uuid references public.campuses (id) on delete set null,
  target_month  text not null check (target_month ~ '^\d{4}-\d{2}$'),
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  unique (teacher_id, batch_id, target_month)
);

create index if not exists idx_lpa_teacher_month on public.lesson_plan_assignments (teacher_id, target_month);
create index if not exists idx_lpa_campus_month  on public.lesson_plan_assignments (campus_id, target_month);

alter table public.lesson_plan_assignments enable row level security;

-- Read: super_admin anywhere, coordinator within their campus, teacher their own.
drop policy if exists lpa_read on public.lesson_plan_assignments;
create policy lpa_read on public.lesson_plan_assignments for select
  using (
    public.is_super_admin()
    or public.is_coordinator_of_campus(campus_id)
    or teacher_id = auth.uid()
  );

-- Write: super_admin anywhere.
drop policy if exists lpa_admin on public.lesson_plan_assignments;
create policy lpa_admin on public.lesson_plan_assignments for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- Write: coordinator only within their assigned campus.
drop policy if exists lpa_coordinator on public.lesson_plan_assignments;
create policy lpa_coordinator on public.lesson_plan_assignments for all
  using (public.is_coordinator_of_campus(campus_id))
  with check (public.is_coordinator_of_campus(campus_id));

-- ----------------------------------------------------------------------------
-- lesson_plans: the actual weekly submission. One row per
-- (teacher, batch, month, week) — upserted on that key.
-- ----------------------------------------------------------------------------
create table if not exists public.lesson_plans (
  id            uuid primary key default gen_random_uuid(),
  teacher_id    uuid not null references public.profiles (id) on delete cascade,
  batch_id      uuid not null references public.batches (id) on delete cascade,
  -- Denormalised from the batch for RLS + campus filters (no join needed).
  campus_id     uuid references public.campuses (id) on delete set null,
  target_month  text not null check (target_month ~ '^\d{4}-\d{2}$'),
  week_number   int not null check (week_number between 1 and 5),
  description   text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (teacher_id, batch_id, target_month, week_number)
);

create index if not exists idx_lp_teacher_month on public.lesson_plans (teacher_id, target_month);
create index if not exists idx_lp_campus_month  on public.lesson_plans (campus_id, target_month);
create index if not exists idx_lp_batch         on public.lesson_plans (batch_id);

alter table public.lesson_plans enable row level security;

-- Helper: is the current user assigned to plan `p_batch` in `p_month`?
create or replace function public.is_assigned_to_batch_month(p_batch uuid, p_month text)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.lesson_plan_assignments
    where batch_id = p_batch and teacher_id = auth.uid() and target_month = p_month
  );
$$;

-- Read: super_admin anywhere, coordinator within their campus, teacher their own.
drop policy if exists lp_read on public.lesson_plans;
create policy lp_read on public.lesson_plans for select
  using (
    public.is_super_admin()
    or public.is_coordinator_of_campus(campus_id)
    or teacher_id = auth.uid()
  );

-- Write: super_admin anywhere.
drop policy if exists lp_admin on public.lesson_plans;
create policy lp_admin on public.lesson_plans for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- Write: the owning teacher, but only for a batch/month they're assigned to.
-- (No role check — an Admin who assigns themselves a batch qualifies too.)
drop policy if exists lp_owner on public.lesson_plans;
create policy lp_owner on public.lesson_plans for all
  using (teacher_id = auth.uid())
  with check (
    teacher_id = auth.uid()
    and public.is_assigned_to_batch_month(batch_id, target_month)
  );

-- Keep updated_at current on edit.
create or replace function public.touch_lesson_plan()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_touch_lesson_plan on public.lesson_plans;
create trigger trg_touch_lesson_plan
  before update on public.lesson_plans
  for each row execute function public.touch_lesson_plan();

-- Verify:
--   select teacher_id, batch_id, target_month, week_number, updated_at
--   from public.lesson_plans order by updated_at desc;
