-- ============================================================================
-- ADIMS — Missed daily-report reminder (in-app notifications)
--
-- Prereqs (run once in Supabase, Dashboard → Database → Extensions):
--   • enable extension "pg_cron"   (schedules the job)
--   • the public.notifications table already exists in schema.sql
--
-- This adds a function that, for every active teacher who has NOT submitted a
-- daily_report for today, inserts a single reminder notification (de-duped),
-- and schedules it to run every evening at 13:00 UTC ≈ 19:00 Asia/Dhaka.
--
-- Safe to re-run.
-- ============================================================================

create extension if not exists pg_cron;

-- ----------------------------------------------------------------------------
-- Insert a "report missing" notification for each active teacher with no
-- daily_reports row for current_date. Skips users who already got today's
-- reminder, so it is safe to call multiple times.
-- ----------------------------------------------------------------------------
create or replace function public.notify_missing_reports()
returns integer
language plpgsql
security definer
set search_path = public as $$
declare
  v_count integer := 0;
begin
  insert into public.notifications (user_id, title, body, link)
  select p.id,
         'আজকের রিপোর্ট বাকি',
         'অনুগ্রহ করে আজকের দৈনিক রিপোর্ট জমা দিন।',
         '/my/report'
  from public.profiles p
  where p.role = 'teacher'
    and p.is_active = true
    -- no daily report submitted today
    and not exists (
      select 1 from public.daily_reports r
      where r.teacher_id = p.id and r.report_date = current_date
    )
    -- and not already reminded today
    and not exists (
      select 1 from public.notifications n
      where n.user_id = p.id
        and n.link = '/my/report'
        and n.created_at::date = current_date
    );
  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- ----------------------------------------------------------------------------
-- Schedule: every day at 13:00 UTC (≈ 7:00 PM Bangladesh time).
-- Re-running unschedules the old job first so the schedule stays single.
-- ----------------------------------------------------------------------------
do $$
begin
  perform cron.unschedule('adims_missed_reports');
exception when others then null;
end $$;

select cron.schedule(
  'adims_missed_reports',
  '0 13 * * *',
  $$select public.notify_missing_reports();$$
);

-- Verify:
--   select * from cron.job;                       -- job is listed
--   select public.notify_missing_reports();       -- run on demand
--   select * from public.notifications order by created_at desc limit 20;
