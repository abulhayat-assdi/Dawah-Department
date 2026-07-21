-- ============================================================================
-- ADIMS — Soft delete + Trash for batches
--
-- Batches are never hard-deleted directly anymore. `deleteBatch` (app code)
-- now sets `deleted_at`; a Trash page (super_admin only) lets you Restore or
-- Permanently Delete. Anything left in Trash for 30+ days is auto-purged
-- daily by pg_cron (same pattern as notifications_cron.sql).
--
-- Safe to re-run.
-- ============================================================================

alter table public.batches add column if not exists deleted_at timestamptz;
create index if not exists idx_batches_deleted_at on public.batches (deleted_at);

-- ----------------------------------------------------------------------------
-- course_tracker view: recreated (drop+create, since column set/order is
-- unchanged but CREATE OR REPLACE VIEW still can't be trusted across
-- environments that ran 02_ at different times) to exclude soft-deleted
-- batches from every consumer (admin tracker, batch list, "My Batches").
-- ----------------------------------------------------------------------------
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
left join public.campuses cam on cam.id = b.campus_id
where b.deleted_at is null;

-- ----------------------------------------------------------------------------
-- Auto-purge: anything soft-deleted for 30+ days is gone for good.
-- ----------------------------------------------------------------------------
create or replace function public.purge_old_deleted_batches()
returns integer
language plpgsql
security definer
set search_path = public as $$
declare
  v_count integer := 0;
begin
  delete from public.batches
  where deleted_at is not null
    and deleted_at < now() - interval '30 days';
  get diagnostics v_count = row_count;
  return v_count;
end $$;

do $$
begin
  perform cron.unschedule('adims_purge_deleted_batches');
exception when others then null;
end $$;

select cron.schedule(
  'adims_purge_deleted_batches',
  '30 2 * * *', -- 02:30 UTC daily
  $$select public.purge_old_deleted_batches();$$
);

-- Verify:
--   select * from cron.job where jobname = 'adims_purge_deleted_batches';
--   select public.purge_old_deleted_batches();
--   select id, batch_no, deleted_at from public.batches where deleted_at is not null;
