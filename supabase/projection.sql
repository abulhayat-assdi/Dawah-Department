-- ============================================================================
-- ADIMS — Add velocity projection to course_tracker (for existing databases)
--
-- Fresh installs already get this via schema.sql. Run this only when UPGRADING
-- an existing database so the tracker gains `projected_days_left`.
--
-- Safe to re-run.
-- ============================================================================

create or replace view public.course_tracker as
select
  b.id              as batch_id,
  c.id              as course_id,
  c.abbreviation    as course_info,
  c.name            as course_name,
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
join public.courses c   on c.id = b.course_id
left join public.campuses cam on cam.id = c.campus_id;
