-- ============================================================================
-- ADIMS — Monthly Class & Task Allocation, revision 2
--
-- Builds on 05_task_allocation.sql:
--   * Adds the "other" class type (a plain, dated task) to the allowed set.
--   * Adds `target_month` (text, "YYYY-MM") — the month a monthly class quota
--     is assigned for. Null for "other" tasks (which use due_date instead).
--
-- Run AFTER 05_task_allocation.sql. Safe to re-run.
-- ============================================================================

alter table public.tasks add column if not exists target_month text;

-- Widen the class_type check to include 'other'. Drop-and-recreate because a
-- CHECK constraint can't be altered in place.
alter table public.tasks drop constraint if exists tasks_class_type_check;
do $$
begin
  alter table public.tasks
    add constraint tasks_class_type_check
    check (class_type in ('quran', 'dawah', 'staff', 'other'));
exception
  when duplicate_object then null;
end $$;

-- Verify:
--   select id, title, class_type, target_month, target_count, due_date
--   from public.tasks;
