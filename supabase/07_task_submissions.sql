-- ============================================================================
-- ADIMS — Task Submissions, Form Verification & the reporting substrate
--
-- Builds on 05/06_task_allocation*.sql. Adds:
--   1. `tasks.course_id`  — the course a Form-Verification allocation targets
--      (its batch dropdown is filtered by this course, not by campus).
--   2. The `form_verification` class type on the tasks CHECK constraint.
--   3. `public.task_submissions` — one row per teacher-submitted class update or
--      completed task. Aggregating these against the `tasks` allocations powers
--      the Task Report dashboard (target vs. actually-taken).
--   4. The `task-files` storage bucket (100 MB cap) for submission attachments.
--
-- Run AFTER 06_task_allocation_v2.sql. Safe to re-run.
-- ============================================================================

-- 1 & 2 — extend the allocations table -------------------------------------
alter table public.tasks add column if not exists course_id uuid
  references public.courses (id) on delete set null;

alter table public.tasks drop constraint if exists tasks_class_type_check;
do $$
begin
  alter table public.tasks
    add constraint tasks_class_type_check
    check (class_type in ('quran', 'dawah', 'staff', 'other', 'form_verification'));
exception
  when duplicate_object then null;
end $$;

create index if not exists idx_tasks_course on public.tasks (course_id);

-- 3 — submissions ----------------------------------------------------------
create table if not exists public.task_submissions (
  id              uuid primary key default gen_random_uuid(),
  -- The allocation this fulfils. Null for an "additional" class the teacher
  -- took for a batch they were not allocated (is_additional = true).
  task_id         uuid references public.tasks (id) on delete set null,
  teacher_id      uuid not null references public.profiles (id) on delete cascade,
  -- Mirrors the allocation's category so the report can group without a join.
  class_type      text not null
                  check (class_type in ('quran', 'dawah', 'staff', 'other', 'form_verification')),
  campus_id       uuid references public.campuses (id) on delete set null,
  course_id       uuid references public.courses (id) on delete set null,
  batch_id        uuid references public.batches (id) on delete set null,
  -- Class date / completion date of the submission.
  submission_date date not null default current_date,
  -- Denormalised "YYYY-MM" of submission_date, for monthly report aggregation.
  target_month    text,
  topic           text,            -- Class Topic (quran/dawah/staff)
  comments        text,
  -- True when the teacher used the "Taken additional class" override to submit
  -- for a batch outside their monthly allocation.
  is_additional   boolean not null default false,
  -- Form Verification: number of forms verified in this submission.
  verified_count  int not null default 0,
  -- Uploaded attachment (public URL in the task-files bucket) + display name.
  file_url        text,
  file_name       text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_tsub_teacher on public.task_submissions (teacher_id);
create index if not exists idx_tsub_task    on public.task_submissions (task_id);
create index if not exists idx_tsub_month   on public.task_submissions (target_month);
create index if not exists idx_tsub_campus  on public.task_submissions (campus_id);

alter table public.task_submissions enable row level security;

-- super_admin: everything.
drop policy if exists tsub_admin on public.task_submissions;
create policy tsub_admin on public.task_submissions for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- teacher: full CRUD over their own submissions.
drop policy if exists tsub_owner on public.task_submissions;
create policy tsub_owner on public.task_submissions for all
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

-- coordinator: read submissions belonging to their campus (for the report).
drop policy if exists tsub_coordinator_read on public.task_submissions;
create policy tsub_coordinator_read on public.task_submissions for select
  using (public.is_coordinator_of_campus(campus_id));

-- 4 — attachment bucket (100 MB) -------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('task-files', 'task-files', true, 104857600)
on conflict (id) do update set public = true, file_size_limit = 104857600;

drop policy if exists "task-files upload" on storage.objects;
create policy "task-files upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'task-files');

drop policy if exists "task-files read" on storage.objects;
create policy "task-files read" on storage.objects
  for select using (bucket_id = 'task-files');

drop policy if exists "task-files delete" on storage.objects;
create policy "task-files delete" on storage.objects
  for delete to authenticated using (bucket_id = 'task-files');

-- Verify:
--   select id, teacher_id, class_type, target_month, verified_count, file_url
--   from public.task_submissions order by created_at desc;
