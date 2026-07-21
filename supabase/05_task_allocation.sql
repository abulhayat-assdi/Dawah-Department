-- ============================================================================
-- ADIMS — Monthly Class & Task Allocation
--
-- Extends `tasks` so a task can represent a monthly class/task allocation:
--   * class_type   — categorises the allocation (quran / dawah / staff).
--   * batch_id     — the batch the allocation targets (null for staff classes).
--   * target_count — the monthly class/task quota assigned to the member.
--
-- Existing "plain" tasks keep working: all three columns are nullable /
-- default 0, so historical rows are untouched.
--
-- Safe to re-run.
-- ============================================================================

alter table public.tasks add column if not exists class_type   text;
alter table public.tasks add column if not exists batch_id     uuid references public.batches (id) on delete set null;
alter table public.tasks add column if not exists target_count int not null default 0;

-- class_type is a small closed set; enforce it without a dedicated enum so the
-- migration stays idempotent and additive.
do $$
begin
  alter table public.tasks
    add constraint tasks_class_type_check
    check (class_type in ('quran', 'dawah', 'staff'));
exception
  when duplicate_object then null;
end $$;

create index if not exists idx_tasks_batch on public.tasks (batch_id);

-- Verify:
--   select id, title, class_type, batch_id, target_count from public.tasks;
