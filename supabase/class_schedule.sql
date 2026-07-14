-- ============================================================================
-- ADIMS — Daily Class Verification
--
-- class_schedule: a pre-populated schedule of classes (from an uploaded CSV
-- or a pasted block, or a single manual row) that a teacher then verifies by
-- choosing one of 3 actions:
--   'done'             → confirms the class; inserts/keeps a matching
--                         class_logs row (the existing sync_completed_classes
--                         trigger in schema.sql then bumps completed_classes).
--   'pending'          → awaiting action (the default on import).
--   'schedule_changed' → postponed; explicitly excluded from the pending
--                         list and from completed-class counting (it never
--                         creates a class_logs row), so progress % is
--                         unaffected.
--
-- Run after schema.sql, 01_add_coordinator_role.sql AND
-- 02_coordinator_and_batches.sql (uses is_assigned_to_batch() and
-- is_coordinator_of_batch()). Safe to re-run.
-- ============================================================================

create table if not exists public.class_schedule (
  id           uuid primary key default gen_random_uuid(),
  batch_id     uuid not null references public.batches (id) on delete cascade,
  teacher_id   uuid not null references public.profiles (id) on delete cascade,
  class_date   date not null,
  topic_id     uuid references public.syllabus_topics (id) on delete set null,
  topic_label  text,                     -- raw topic text from the import (may not match a syllabus_topics row)
  source       text not null default 'manual' check (source in ('csv', 'manual')),
  status       text not null default 'pending' check (status in ('pending', 'done', 'schedule_changed')),
  class_log_id uuid references public.class_logs (id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (batch_id, teacher_id, class_date)
);

create index if not exists idx_class_schedule_batch on public.class_schedule (batch_id, class_date);
create index if not exists idx_class_schedule_teacher on public.class_schedule (teacher_id, status);

alter table public.class_schedule enable row level security;

drop policy if exists cs_sched_read on public.class_schedule;
create policy cs_sched_read on public.class_schedule for select using (auth.uid() is not null);

drop policy if exists cs_sched_admin on public.class_schedule;
create policy cs_sched_admin on public.class_schedule for all
  using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists cs_sched_teacher on public.class_schedule;
create policy cs_sched_teacher on public.class_schedule for all
  using (public.is_assigned_to_batch(batch_id) and teacher_id = auth.uid())
  with check (public.is_assigned_to_batch(batch_id) and teacher_id = auth.uid());

drop policy if exists cs_sched_coordinator on public.class_schedule;
create policy cs_sched_coordinator on public.class_schedule for all
  using (public.is_coordinator_of_batch(batch_id))
  with check (public.is_coordinator_of_batch(batch_id));
