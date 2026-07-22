-- ==========================================================================
-- COMBINED — generated 2026-07-22 14:45 — all supabase/*.sql in dependency order.
-- Excludes: make_super_admin.sql (manual, run separately after creating your
-- admin user in the Dashboard), projection.sql (redundant with schema.sql on
-- a fresh DB), and seed_demo_users.sql (demo login accounts, not needed).
-- All source files are written to be safe to re-run (IF NOT EXISTS / ON
-- CONFLICT / DROP...IF EXISTS guards), so running this whole batch again
-- later will not duplicate data or error on things that already exist.
-- ==========================================================================


-- ============================== schema.sql ==============================
-- ============================================================================
-- ADIMS — AsSDI Dawah Integrated Management System
-- Supabase schema: tables, enums, helper functions, triggers, and RLS policies.
-- Run this in the Supabase SQL editor (or `supabase db push`).
-- ============================================================================

-- Extensions ----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Enums ---------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('super_admin', 'teacher');
exception when duplicate_object then null; end $$;

do $$ begin
  create type course_category as enum ('alem', 'general', 'common');
exception when duplicate_object then null; end $$;

do $$ begin
  create type batch_status as enum ('will_start', 'ongoing', 'completed');
exception when duplicate_object then null; end $$;

-- 🟢 green = done, 🟡 yellow = pending, 🔴 red = none/not yet
do $$ begin
  create type exam_status as enum ('done', 'pending', 'none');
exception when duplicate_object then null; end $$;

do $$ begin
  create type topic_status as enum ('pending', 'done');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_status as enum ('todo', 'doing', 'done');
exception when duplicate_object then null; end $$;

do $$ begin
  create type assessment_type as enum ('entry', 'peer', 'exit');
exception when duplicate_object then null; end $$;

do $$ begin
  create type resource_type as enum ('slide', 'pdf', 'book', 'link', 'video');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- Core tables
-- ============================================================================

-- Profiles: one row per auth user. role drives access.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  role        user_role not null default 'teacher',
  designation text,                       -- e.g. দাওয়াহ প্রশিক্ষক
  phone       text,
  location    text,                       -- জন্মস্থান / অবস্থান
  photo_url   text,
  bio         text,
  background  text,                       -- ঐতিহাসিক পটভূমি
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.campuses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique,
  address     text,
  description text,
  created_at  timestamptz not null default now()
);

-- Teacher ⇄ campus (a member can serve multiple campuses).
create table if not exists public.teacher_campuses (
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  campus_id  uuid not null references public.campuses (id) on delete cascade,
  primary key (teacher_id, campus_id)
);

create table if not exists public.courses (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  abbreviation  text not null,            -- SSELP, AOC, PMTT ...
  campus_id     uuid references public.campuses (id) on delete set null,
  category      course_category not null default 'common',
  duration_label text,                    -- "৩ মাস", "৪ মাস", "১৫ দিন"
  default_total_classes int not null default 0,
  description   text,
  created_at    timestamptz not null default now()
);

-- Syllabus / curriculum per course.
create table if not exists public.syllabus_topics (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses (id) on delete cascade,
  sequence    int not null default 0,
  title       text not null,
  description text,
  created_at  timestamptz not null default now()
);

-- A running batch of a course.
create table if not exists public.batches (
  id               uuid primary key default gen_random_uuid(),
  course_id        uuid not null references public.courses (id) on delete cascade,
  batch_no         text not null,
  duration_label   text,
  start_date       date,
  dawah_end_date   date,                  -- last date dawah classes are taken
  farewell_date    date,                  -- expected finish (Farewell Date)
  total_classes    int not null default 0,
  completed_classes int not null default 0, -- auto-synced from class_logs
  midterm_status   exam_status not null default 'none',
  final_status     exam_status not null default 'none',
  status           batch_status not null default 'will_start',
  note             text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Which teacher(s) run a batch — this drives ROW-WISE update access.
create table if not exists public.batch_teachers (
  batch_id   uuid not null references public.batches (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  role_label text,                        -- "কুরআন ক্লাস", "দাওয়াহ ক্লাস"
  primary key (batch_id, teacher_id)
);

-- Topic completion per batch.
create table if not exists public.batch_topic_progress (
  id            uuid primary key default gen_random_uuid(),
  batch_id      uuid not null references public.batches (id) on delete cascade,
  topic_id      uuid not null references public.syllabus_topics (id) on delete cascade,
  status        topic_status not null default 'pending',
  completed_date date,
  updated_by    uuid references public.profiles (id) on delete set null,
  updated_at    timestamptz not null default now(),
  unique (batch_id, topic_id)
);

-- Per-class log. Inserting a confirmed log auto-bumps completed_classes.
create table if not exists public.class_logs (
  id            uuid primary key default gen_random_uuid(),
  batch_id      uuid not null references public.batches (id) on delete cascade,
  teacher_id    uuid not null references public.profiles (id) on delete cascade,
  topic_id      uuid references public.syllabus_topics (id) on delete set null,
  class_date    date not null default current_date,
  duration_minutes int default 60,
  counseling_count int default 0,
  note          text,
  confirmed     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Entry / peer / exit assessments per batch.
create table if not exists public.assessments (
  id          uuid primary key default gen_random_uuid(),
  batch_id    uuid not null references public.batches (id) on delete cascade,
  type        assessment_type not null,
  is_done     boolean not null default false,
  done_date   date,
  note        text,
  unique (batch_id, type)
);

-- Task management (To-do / Doing / Done).
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  campus_id   uuid references public.campuses (id) on delete set null,
  assigned_to uuid references public.profiles (id) on delete set null,
  assigned_by uuid references public.profiles (id) on delete set null,
  status      task_status not null default 'todo',
  priority    int not null default 0,     -- 0 normal, 1 high
  due_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Daily reports submitted by members.
create table if not exists public.daily_reports (
  id             uuid primary key default gen_random_uuid(),
  teacher_id     uuid not null references public.profiles (id) on delete cascade,
  report_date    date not null default current_date,
  work_hours     numeric(4,1) default 0,
  counseling_count int default 0,
  topics_covered text,
  summary        text,
  created_at     timestamptz not null default now(),
  unique (teacher_id, report_date)
);

-- Resource center (slides / pdf / books / links).
create table if not exists public.resources (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  type        resource_type not null default 'pdf',
  url         text,
  campus_id   uuid references public.campuses (id) on delete set null,
  course_id   uuid references public.courses (id) on delete set null,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- In-app notifications (e.g. "report missing" reminders).
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text not null,
  body       text,
  link       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

-- Public feedback / complaints (from the website contact form).
create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  phone      text,
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Helper functions (SECURITY DEFINER so RLS can call them without recursion)
-- ============================================================================
create or replace function public.current_role()
returns user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role = 'super_admin' from public.profiles where id = auth.uid()),
    false);
$$;

create or replace function public.is_assigned_to_batch(p_batch uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.batch_teachers
    where batch_id = p_batch and teacher_id = auth.uid()
  );
$$;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Create a profile row automatically when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'teacher')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep batches.completed_classes in sync with confirmed class_logs.
create or replace function public.sync_completed_classes()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_batch uuid := coalesce(new.batch_id, old.batch_id);
begin
  update public.batches b
     set completed_classes = (
           select count(*) from public.class_logs
           where batch_id = v_batch and confirmed = true),
         updated_at = now()
   where b.id = v_batch;
  return coalesce(new, old);
end $$;

drop trigger if exists trg_sync_completed on public.class_logs;
create trigger trg_sync_completed
  after insert or update or delete on public.class_logs
  for each row execute function public.sync_completed_classes();

-- generic updated_at bump
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_touch_batches on public.batches;
create trigger trg_touch_batches before update on public.batches
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_tasks on public.tasks;
create trigger trg_touch_tasks before update on public.tasks
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_profiles on public.profiles;
create trigger trg_touch_profiles before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- Convenience view: the course-progress tracker table from the spec.
-- (drop+create, not "or replace" — a production DB may already have this
-- view with a different column set from an earlier partial push, and
-- CREATE OR REPLACE VIEW cannot drop/reorder columns.)
-- ============================================================================
drop view if exists public.course_tracker;
create view public.course_tracker as
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
  -- Velocity-based projection: at the current pace, estimated days still needed.
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

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles            enable row level security;
alter table public.campuses            enable row level security;
alter table public.teacher_campuses    enable row level security;
alter table public.courses             enable row level security;
alter table public.syllabus_topics     enable row level security;
alter table public.batches             enable row level security;
alter table public.batch_teachers      enable row level security;
alter table public.batch_topic_progress enable row level security;
alter table public.class_logs          enable row level security;
alter table public.assessments         enable row level security;
alter table public.tasks               enable row level security;
alter table public.daily_reports       enable row level security;
alter table public.resources           enable row level security;
alter table public.notifications       enable row level security;
alter table public.feedback            enable row level security;

-- ---- profiles ----
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select using (auth.uid() is not null);

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update using (id = auth.uid() or public.is_super_admin());

drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ---- generic: admins write, everyone authenticated reads ----
-- campuses
drop policy if exists campuses_read on public.campuses;
create policy campuses_read on public.campuses for select using (auth.uid() is not null);
drop policy if exists campuses_admin on public.campuses;
create policy campuses_admin on public.campuses for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- teacher_campuses
drop policy if exists tc_read on public.teacher_campuses;
create policy tc_read on public.teacher_campuses for select using (auth.uid() is not null);
drop policy if exists tc_admin on public.teacher_campuses;
create policy tc_admin on public.teacher_campuses for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- courses
drop policy if exists courses_read on public.courses;
create policy courses_read on public.courses for select using (auth.uid() is not null);
drop policy if exists courses_admin on public.courses;
create policy courses_admin on public.courses for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- syllabus_topics
drop policy if exists syllabus_read on public.syllabus_topics;
create policy syllabus_read on public.syllabus_topics for select using (auth.uid() is not null);
drop policy if exists syllabus_admin on public.syllabus_topics;
create policy syllabus_admin on public.syllabus_topics for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- batches: read all; admins write all; assigned teachers may UPDATE their batch.
drop policy if exists batches_read on public.batches;
create policy batches_read on public.batches for select using (auth.uid() is not null);
drop policy if exists batches_admin on public.batches;
create policy batches_admin on public.batches for all
  using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists batches_teacher_update on public.batches;
create policy batches_teacher_update on public.batches for update
  using (public.is_assigned_to_batch(id))
  with check (public.is_assigned_to_batch(id));

-- batch_teachers (assignment) — admin only writes.
drop policy if exists bt_read on public.batch_teachers;
create policy bt_read on public.batch_teachers for select using (auth.uid() is not null);
drop policy if exists bt_admin on public.batch_teachers;
create policy bt_admin on public.batch_teachers for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- batch_topic_progress: read all; admin all; assigned teacher writes own batch.
drop policy if exists btp_read on public.batch_topic_progress;
create policy btp_read on public.batch_topic_progress for select using (auth.uid() is not null);
drop policy if exists btp_admin on public.batch_topic_progress;
create policy btp_admin on public.batch_topic_progress for all
  using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists btp_teacher on public.batch_topic_progress;
create policy btp_teacher on public.batch_topic_progress for all
  using (public.is_assigned_to_batch(batch_id))
  with check (public.is_assigned_to_batch(batch_id));

-- class_logs: read all; admin all; assigned teacher inserts/updates own.
drop policy if exists cl_read on public.class_logs;
create policy cl_read on public.class_logs for select using (auth.uid() is not null);
drop policy if exists cl_admin on public.class_logs;
create policy cl_admin on public.class_logs for all
  using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists cl_teacher on public.class_logs;
create policy cl_teacher on public.class_logs for all
  using (public.is_assigned_to_batch(batch_id) and teacher_id = auth.uid())
  with check (public.is_assigned_to_batch(batch_id) and teacher_id = auth.uid());

-- assessments
drop policy if exists asmt_read on public.assessments;
create policy asmt_read on public.assessments for select using (auth.uid() is not null);
drop policy if exists asmt_admin on public.assessments;
create policy asmt_admin on public.assessments for all
  using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists asmt_teacher on public.assessments;
create policy asmt_teacher on public.assessments for all
  using (public.is_assigned_to_batch(batch_id))
  with check (public.is_assigned_to_batch(batch_id));

-- tasks: admins all; assignees read + update status of their tasks.
drop policy if exists tasks_admin on public.tasks;
create policy tasks_admin on public.tasks for all
  using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists tasks_assignee_read on public.tasks;
create policy tasks_assignee_read on public.tasks for select
  using (assigned_to = auth.uid() or assigned_by = auth.uid());
drop policy if exists tasks_assignee_update on public.tasks;
create policy tasks_assignee_update on public.tasks for update
  using (assigned_to = auth.uid()) with check (assigned_to = auth.uid());

-- daily_reports: admins read all; members CRUD their own.
drop policy if exists reports_admin_read on public.daily_reports;
create policy reports_admin_read on public.daily_reports for select
  using (public.is_super_admin() or teacher_id = auth.uid());
drop policy if exists reports_self on public.daily_reports;
create policy reports_self on public.daily_reports for all
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

-- resources: read all; admin all; uploader manages own.
drop policy if exists res_read on public.resources;
create policy res_read on public.resources for select using (auth.uid() is not null);
drop policy if exists res_admin on public.resources;
create policy res_admin on public.resources for all
  using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists res_owner on public.resources;
create policy res_owner on public.resources for all
  using (uploaded_by = auth.uid()) with check (uploaded_by = auth.uid());

-- notifications: each user sees and updates own.
drop policy if exists notif_self on public.notifications;
create policy notif_self on public.notifications for all
  using (user_id = auth.uid() or public.is_super_admin())
  with check (user_id = auth.uid() or public.is_super_admin());

-- feedback: anyone (even anon) may insert; only admins read.
drop policy if exists feedback_insert on public.feedback;
create policy feedback_insert on public.feedback for insert with check (true);
drop policy if exists feedback_admin on public.feedback;
create policy feedback_admin on public.feedback for select using (public.is_super_admin());

-- Helpful indexes -----------------------------------------------------------
create index if not exists idx_courses_campus on public.courses (campus_id);
create index if not exists idx_batches_course on public.batches (course_id);
create index if not exists idx_bt_teacher on public.batch_teachers (teacher_id);
create index if not exists idx_classlogs_batch on public.class_logs (batch_id);
create index if not exists idx_tasks_assignee on public.tasks (assigned_to);
create index if not exists idx_reports_teacher on public.daily_reports (teacher_id);
create index if not exists idx_notif_user on public.notifications (user_id);


-- ============================== 01_add_coordinator_role.sql ==============================
-- ============================================================================
-- ADIMS — Step 1 of 2 for the Coordinator role.
--
-- IMPORTANT: Run ONLY this one statement by itself in the SQL Editor (its own
-- "Run"), separate from every other migration. Postgres does not allow
-- `ALTER TYPE ... ADD VALUE` to run in the same multi-statement script as
-- other commands — if you paste this together with other SQL, the whole
-- script fails and nothing after it gets created (this is exactly what
-- happened when sheds_and_roles.sql was run as one block).
--
-- After this succeeds on its own, move on to 02_coordinator_and_batches.sql.
-- ============================================================================

alter type public.user_role add value if not exists 'coordinator';


-- ============================== 02_coordinator_and_batches.sql ==============================
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


-- ============================== 03_batch_soft_delete.sql ==============================
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


-- ============================== 04_access_management.sql ==============================
-- ============================================================================
-- ADIMS — Access Management: multi-role grants + per-user page visibility
--
-- Two new additive tables:
--   profile_roles     — extra roles on top of the existing single
--                       profiles.role ("primary role"). A user's effective
--                       role set = {profiles.role} UNION profile_roles rows.
--                       Real, not cosmetic: is_super_admin() and the
--                       coordinator helper functions below now check both.
--   user_page_access  — explicit per-user sidebar/page grants set by the
--                       Super Admin from the new /admin/access page. When a
--                       user has no rows here, nav falls back to the union
--                       of their role(s)' default nav (handled in app code).
--
-- Safe to re-run.
-- ============================================================================

create table if not exists public.profile_roles (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role       user_role not null,
  primary key (profile_id, role)
);

create table if not exists public.user_page_access (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  href       text not null,
  primary key (profile_id, href)
);

alter table public.profile_roles     enable row level security;
alter table public.user_page_access  enable row level security;

drop policy if exists profile_roles_read on public.profile_roles;
create policy profile_roles_read on public.profile_roles for select
  using (profile_id = auth.uid() or public.is_super_admin());
drop policy if exists profile_roles_admin on public.profile_roles;
create policy profile_roles_admin on public.profile_roles for all
  using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists user_page_access_read on public.user_page_access;
create policy user_page_access_read on public.user_page_access for select
  using (profile_id = auth.uid() or public.is_super_admin());
drop policy if exists user_page_access_admin on public.user_page_access;
create policy user_page_access_admin on public.user_page_access for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- ----------------------------------------------------------------------------
-- Helper functions: extend to also honor profile_roles, so a granted extra
-- role actually drives RLS-scoped data access, not just a UI badge.
-- ----------------------------------------------------------------------------
create or replace function public.is_super_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'super_admin'
        or exists (
          select 1 from public.profile_roles pr
          where pr.profile_id = p.id and pr.role = 'super_admin'
        )
      )
  );
$$;

create or replace function public.is_coordinator_of_campus(p_campus uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.teacher_campuses tc
    join public.profiles p on p.id = tc.teacher_id
    where tc.campus_id = p_campus
      and tc.teacher_id = auth.uid()
      and (
        p.role = 'coordinator'
        or exists (
          select 1 from public.profile_roles pr
          where pr.profile_id = p.id and pr.role = 'coordinator'
        )
      )
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
      and (
        p.role = 'coordinator'
        or exists (
          select 1 from public.profile_roles pr
          where pr.profile_id = p.id and pr.role = 'coordinator'
        )
      )
  );
$$;

-- Verify:
--   select * from public.profile_roles;
--   select * from public.user_page_access;


-- ============================== amali.sql ==============================
-- ============================================================================
-- ADIMS — Amali (daily spiritual / dawah practice) checklist
--
-- amali_items : the admin-managed list of daily practices.
-- amali_logs  : one row per (teacher, item, day) recording whether it was done.
--
-- RLS mirrors the rest of schema.sql:
--   items  → everyone authed reads, super_admin writes
--   logs   → each member CRUDs only their own rows
--
-- Safe to re-run.
-- ============================================================================

create table if not exists public.amali_items (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  sequence   int  not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.amali_logs (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  item_id    uuid not null references public.amali_items (id) on delete cascade,
  log_date   date not null default current_date,
  done       boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (teacher_id, item_id, log_date)
);

create index if not exists idx_amali_logs_teacher_date
  on public.amali_logs (teacher_id, log_date);

alter table public.amali_items enable row level security;
alter table public.amali_logs  enable row level security;

-- ---- amali_items ----
drop policy if exists amali_items_read on public.amali_items;
create policy amali_items_read on public.amali_items
  for select using (auth.uid() is not null);
drop policy if exists amali_items_admin on public.amali_items;
create policy amali_items_admin on public.amali_items for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- ---- amali_logs ----
drop policy if exists amali_logs_admin_read on public.amali_logs;
create policy amali_logs_admin_read on public.amali_logs for select
  using (public.is_super_admin() or teacher_id = auth.uid());
drop policy if exists amali_logs_self on public.amali_logs;
create policy amali_logs_self on public.amali_logs for all
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());


-- ============================== amali_campus.sql ==============================
-- ============================================================================
-- ADIMS — Amali: campus-scoped routines
--
-- amali_items.campus_id : null = a global routine (visible to everyone, as
--   before); non-null = a routine specific to one campus, manageable by that
--   campus's coordinator(s). The teacher-personal checklist at /my/amali is
--   unchanged — it still shows every active item regardless of campus_id.
--
-- Run after schema.sql, amali.sql, 01_add_coordinator_role.sql AND
-- 02_coordinator_and_batches.sql. Safe to re-run.
-- ============================================================================

alter table public.amali_items
  add column if not exists campus_id uuid references public.campuses (id) on delete cascade;

create index if not exists idx_amali_items_campus on public.amali_items (campus_id);

drop policy if exists amali_items_coordinator on public.amali_items;
create policy amali_items_coordinator on public.amali_items for all
  using (campus_id is not null and public.is_coordinator_of_campus(campus_id))
  with check (campus_id is not null and public.is_coordinator_of_campus(campus_id));


-- ============================== class_schedule.sql ==============================
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


-- ============================== staff_tracker.sql ==============================
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


-- ============================== avatars.sql ==============================
-- ============================================================================
-- ADIMS — Avatars (profile photo) storage bucket
--
-- Public-read bucket for member profile photos. Authenticated users upload;
-- anyone can read (public URLs are stored on profiles.photo_url and shown on
-- the public Member Portfolios page).
--
-- Safe to re-run.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "avatars upload" on storage.objects;
create policy "avatars upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars');

drop policy if exists "avatars update" on storage.objects;
create policy "avatars update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars');

drop policy if exists "avatars read" on storage.objects;
create policy "avatars read" on storage.objects
  for select using (bucket_id = 'avatars');


-- ============================== faculty.sql ==============================
-- ============================================================================
-- ADIMS — Public Faculty list (CMS-managed, separate from member accounts)
--
-- Shown on the public Faculty page and its profile pages. Anonymous visitors
-- read; only super_admin writes. Photos use the existing `avatars` bucket.
--
-- Safe to re-run.
-- ============================================================================

create table if not exists public.faculty (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  designation text,
  photo_url   text,
  background  text,            -- ঐতিহাসিক পটভূমি
  location    text,            -- জন্মস্থান
  bio         text,            -- সম্পূর্ণ বায়োডাটা (rich HTML)
  featured    boolean not null default false,
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);

-- For existing databases created before these columns were added:
alter table public.faculty add column if not exists background text;
alter table public.faculty add column if not exists location text;

create index if not exists idx_faculty_sort on public.faculty (sort, created_at);

alter table public.faculty enable row level security;

drop policy if exists faculty_read on public.faculty;
create policy faculty_read on public.faculty for select using (true);

drop policy if exists faculty_admin on public.faculty;
create policy faculty_admin on public.faculty for all
  using (public.is_super_admin()) with check (public.is_super_admin());

grant select on public.faculty to anon;


-- ============================== batch_dawah_date.sql ==============================
-- ============================================================================
-- ADIMS — "Last dawah-class date" on batches
--
-- Adds dawah_end_date (the last date dawah classes are taken) which sits
-- before the farewell date. Safe to re-run.
-- ============================================================================

alter table public.batches add column if not exists dawah_end_date date;


-- ============================== batch_student_count.sql ==============================
-- ============================================================================
-- ADIMS — Active student count for the public "Dawah Activities" page
--
-- Adds a manually-maintained headcount to batches (coordinators/admins fill
-- it in on the batch edit form) and opens read access to batches for the
-- anon role, so the public Activities page can show currently running
-- courses per campus with their active student count, without login.
--
-- Safe to re-run.
-- ============================================================================

alter table public.batches add column if not exists active_student_count integer not null default 0;

-- Public read of batches (RLS already allows authenticated; grant anon too).
-- Batches carry no sensitive data (course/campus links, dates, counts).
drop policy if exists batches_public_read on public.batches;
create policy batches_public_read on public.batches
  for select using (true);

grant select on public.batches to anon;


-- ============================== campus_image.sql ==============================
-- ============================================================================
-- ADIMS — Campus image for the public "Dawah Activities" page
--
-- Adds an optional image to campuses and exposes safe campus columns to the
-- anon role so the public Activities page can list them without login.
--
-- Safe to re-run.
-- ============================================================================

alter table public.campuses add column if not exists image_url text;

-- Public read of campuses (RLS already allows authenticated; grant anon too).
drop policy if exists campuses_public_read on public.campuses;
create policy campuses_public_read on public.campuses
  for select using (true);

grant select on public.campuses to anon;

-- Public read of courses (names/levels only are rendered on the public site).
drop policy if exists courses_public_read on public.courses;
create policy courses_public_read on public.courses
  for select using (true);

grant select on public.courses to anon;


-- ============================== resources_bucket.sql ==============================
-- ============================================================================
-- ADIMS — Resource Center file storage bucket
--
-- Public-read bucket for resource files (slides, PDFs, books). Authenticated
-- users (the coordinator) upload; the public URL is stored on resources.url.
--
-- Safe to re-run.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('resources', 'resources', true)
on conflict (id) do update set public = true;

drop policy if exists "resources upload" on storage.objects;
create policy "resources upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'resources');

drop policy if exists "resources read" on storage.objects;
create policy "resources read" on storage.objects
  for select using (bucket_id = 'resources');

drop policy if exists "resources delete" on storage.objects;
create policy "resources delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'resources');


-- ============================== syllabus.sql ==============================
-- ============================================================================
-- ADIMS — Course Syllabus PDF Management
--
-- Reuses the existing `resources` table/bucket (resources_bucket.sql already
-- makes the storage bucket public-read). Adds `syllabus_kind` so a course can
-- have up to 3 syllabus PDFs (Quran / General / Dawah class), and opens
-- anonymous SELECT for just those rows so the public academic page can list
-- and link to them without a login.
--
-- Run after schema.sql. Safe to re-run.
-- ============================================================================

alter table public.resources
  add column if not exists syllabus_kind text check (syllabus_kind in ('quran', 'general', 'dawah'));

create index if not exists idx_resources_syllabus on public.resources (course_id, syllabus_kind);

-- Additional permissive SELECT policy: anyone (even anon) may read a
-- resource row that is a syllabus document. The existing res_read policy
-- (auth.uid() is not null) still covers every other authenticated read.
drop policy if exists res_syllabus_public_read on public.resources;
create policy res_syllabus_public_read on public.resources
  for select using (syllabus_kind is not null);

grant select on public.resources to anon;


-- ============================== site_content.sql ==============================
-- ============================================================================
-- ADIMS — Public site content CMS
--
-- A simple key → JSON store powering the public pages (Home, About, Contact)
-- and site identity. The coordinator edits these from /admin/content; the
-- public pages read them. Anonymous visitors may READ; only super_admin writes.
--
-- Safe to re-run.
-- ============================================================================

create table if not exists public.site_content (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

-- Public pages (including logged-out visitors) read content.
drop policy if exists site_content_read on public.site_content;
create policy site_content_read on public.site_content
  for select using (true);

-- Only the coordinator edits content.
drop policy if exists site_content_admin on public.site_content;
create policy site_content_admin on public.site_content for all
  using (public.is_super_admin()) with check (public.is_super_admin());

grant select on public.site_content to anon;

drop trigger if exists trg_touch_site_content on public.site_content;
create trigger trg_touch_site_content before update on public.site_content
  for each row execute function public.touch_updated_at();

-- Seed default rows (kept empty; the app supplies default copy via lib/content.ts).
insert into public.site_content (key, value) values
  ('site',       '{}'::jsonb),
  ('home',       '{}'::jsonb),
  ('about',      '{}'::jsonb),
  ('academic',   '{}'::jsonb),
  ('contact',    '{}'::jsonb),
  ('activities', '{}'::jsonb),
  ('faculty',    '{}'::jsonb)
on conflict (key) do nothing;


-- ============================== public_site.sql ==============================
-- ============================================================================
-- ADIMS — Public Member Portfolios view
--
-- Exposes ONLY safe columns of active members to anonymous visitors for the
-- public "Members" page. The base profiles table stays locked down (its RLS
-- requires auth); this view is explicitly granted to the anon role.
--
-- Safe to re-run.
-- ============================================================================

create or replace view public.public_members
with (security_invoker = off) as
select
  p.id,
  p.full_name,
  p.designation,
  p.photo_url,
  p.bio,
  p.background,
  p.location
from public.profiles p
where p.is_active = true
order by p.full_name;

grant select on public.public_members to anon, authenticated;


-- ============================== notices.sql ==============================
-- ============================================================================
-- ADIMS — Notice Board
--
-- Coordinator-posted notices shown on every member's dashboard.
-- RLS: everyone authenticated reads; only super_admin writes.
--
-- Safe to re-run.
-- ============================================================================

create table if not exists public.notices (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notices_created on public.notices (created_at desc);

alter table public.notices enable row level security;

drop policy if exists notices_read on public.notices;
create policy notices_read on public.notices
  for select using (auth.uid() is not null);

drop policy if exists notices_admin on public.notices;
create policy notices_admin on public.notices for all
  using (public.is_super_admin()) with check (public.is_super_admin());

drop trigger if exists trg_touch_notices on public.notices;
create trigger trg_touch_notices before update on public.notices
  for each row execute function public.touch_updated_at();


-- ============================== notices_public.sql ==============================
-- ============================================================================
-- ADIMS — Notice Board: Shed Head (coordinator) posting + public visibility
--
-- In this org a "Shed Head" is a Campus Coordinator (see the design note in
-- 02_coordinator_and_batches.sql: "Shed was dropped — a Shed IS a Campus").
-- This migration lets coordinators create/edit/delete notices alongside
-- super_admin, and opens read access to the anon role so published notices
-- show on the public notice board for everyone, not just logged-in members.
--
-- Run AFTER notices.sql. Safe to re-run.
-- ============================================================================

drop policy if exists notices_admin on public.notices;
create policy notices_admin on public.notices for all
  using (public.is_super_admin() or public.current_role() = 'coordinator')
  with check (public.is_super_admin() or public.current_role() = 'coordinator');

drop policy if exists notices_public_read on public.notices;
create policy notices_public_read on public.notices
  for select using (true);

grant select on public.notices to anon;


-- ============================== feedback_admin_review.sql ==============================
-- ============================================================================
-- ADIMS — Feedback & Complaint admin review upgrade
--
-- Lets Super Admins AND Coordinators read, mark-as-read, and delete feedback
-- (previously only super_admin could even read a row, so the coordinator
-- dashboard's feedback panel silently showed nothing). Public/anon insert
-- (feedback_insert) is unchanged.
--
-- Run AFTER schema.sql. Safe to re-run.
-- ============================================================================

drop policy if exists feedback_admin on public.feedback;
create policy feedback_admin on public.feedback for select
  using (public.is_super_admin() or public.current_role() = 'coordinator');

drop policy if exists feedback_admin_update on public.feedback;
create policy feedback_admin_update on public.feedback for update
  using (public.is_super_admin() or public.current_role() = 'coordinator')
  with check (public.is_super_admin() or public.current_role() = 'coordinator');

drop policy if exists feedback_admin_delete on public.feedback;
create policy feedback_admin_delete on public.feedback for delete
  using (public.is_super_admin() or public.current_role() = 'coordinator');


-- ============================== notices_campus_scope.sql ==============================
-- ============================================================================
-- ADIMS — Notice Board: member-only + campus-scoped visibility
--
-- The Notice Board is no longer shown on the public website — only signed-in
-- members see it, on their dashboard. Notices can target a specific campus
-- (campus_id set) or "all campuses" (campus_id null).
--
-- Posting: super_admin (any campus, or all-campus) and coordinators / "Shed
-- Head" (their own assigned campus, or all-campus — see
-- is_coordinator_of_campus() in 02_coordinator_and_batches.sql).
--
-- Reading: a member sees a notice if it's all-campus, or if they're linked
-- to that notice's campus via teacher_campuses (this table already covers
-- both teachers and coordinators).
--
-- Run AFTER schema.sql, notices.sql, 02_coordinator_and_batches.sql,
-- notices_public.sql, feedback_admin_review.sql. Safe to re-run.
-- ============================================================================

alter table public.notices add column if not exists campus_id uuid references public.campuses (id) on delete cascade;

create index if not exists idx_notices_campus on public.notices (campus_id);

-- Public/anon access is revoked — Notice Board is member-only from now on.
revoke select on public.notices from anon;
drop policy if exists notices_public_read on public.notices;

-- ---- select: all-campus notices, or notices for a campus the member belongs to ----
drop policy if exists notices_read on public.notices;
create policy notices_read on public.notices for select
  using (
    auth.uid() is not null
    and (
      campus_id is null
      or public.is_super_admin()
      or exists (
        select 1 from public.teacher_campuses tc
        where tc.teacher_id = auth.uid() and tc.campus_id = notices.campus_id
      )
    )
  );

-- ---- write: super_admin (any campus) or coordinator (own campus, or all-campus) ----
drop policy if exists notices_admin on public.notices;

drop policy if exists notices_insert on public.notices;
create policy notices_insert on public.notices for insert
  with check (
    public.is_super_admin()
    or (
      public.current_role() = 'coordinator'
      and (campus_id is null or public.is_coordinator_of_campus(campus_id))
    )
  );

drop policy if exists notices_update on public.notices;
create policy notices_update on public.notices for update
  using (
    public.is_super_admin()
    or (
      public.current_role() = 'coordinator'
      and (campus_id is null or public.is_coordinator_of_campus(campus_id))
    )
  )
  with check (
    public.is_super_admin()
    or (
      public.current_role() = 'coordinator'
      and (campus_id is null or public.is_coordinator_of_campus(campus_id))
    )
  );

drop policy if exists notices_delete on public.notices;
create policy notices_delete on public.notices for delete
  using (
    public.is_super_admin()
    or (
      public.current_role() = 'coordinator'
      and (campus_id is null or public.is_coordinator_of_campus(campus_id))
    )
  );


-- ============================== messages.sql ==============================
-- ============================================================================
-- ADIMS — Internal communication (text + voice messages)
--
-- A single shared team channel for the Dawah Department members. Voice notes
-- are uploaded to the `voice-messages` storage bucket; the public URL is stored
-- on the message row for playback.
--
-- Safe to re-run.
-- ============================================================================

create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  body       text,
  audio_url  text,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_created on public.messages (created_at);

alter table public.messages enable row level security;

-- Everyone authenticated reads the channel.
drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages
  for select using (auth.uid() is not null);

-- A member posts as themselves.
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert with check (sender_id = auth.uid());

-- Sender (or admin) may delete.
drop policy if exists messages_delete on public.messages;
create policy messages_delete on public.messages
  for delete using (sender_id = auth.uid() or public.is_super_admin());

-- ----------------------------------------------------------------------------
-- Storage bucket for voice notes. Public-read (unguessable UUID filenames),
-- authenticated-write. Run in the SQL editor; or create the bucket via
-- Dashboard → Storage and add the two policies below.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('voice-messages', 'voice-messages', true)
on conflict (id) do update set public = true;

drop policy if exists "voice upload" on storage.objects;
create policy "voice upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'voice-messages');

drop policy if exists "voice read" on storage.objects;
create policy "voice read" on storage.objects
  for select using (bucket_id = 'voice-messages');


-- ============================== messages_dm.sql ==============================
-- ============================================================================
-- ADIMS — Direct messaging upgrade (two-pane "Live Support" chat)
--
-- Upgrades the single team channel to 1-to-1 conversations between members:
-- adds a recipient, read flag and file attachment fields, and tightens RLS so
-- only the two participants (and admins) can read a conversation.
--
-- Run AFTER supabase/messages.sql. Safe to re-run.
-- ============================================================================

alter table public.messages add column if not exists recipient_id uuid
  references public.profiles (id) on delete cascade;
alter table public.messages add column if not exists is_read boolean not null default false;
alter table public.messages add column if not exists file_url text;
alter table public.messages add column if not exists file_name text;

create index if not exists idx_messages_pair
  on public.messages (sender_id, recipient_id, created_at);
create index if not exists idx_messages_recipient
  on public.messages (recipient_id, is_read);

-- ---- RLS ----
-- Read: only the two participants (or an admin).
drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages for select
  using (
    sender_id = auth.uid()
    or recipient_id = auth.uid()
    or public.is_super_admin()
  );

-- Insert: you may only send as yourself.
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert
  with check (sender_id = auth.uid());

-- Update: the recipient may mark received messages as read.
drop policy if exists messages_update on public.messages;
create policy messages_update on public.messages for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- Delete: sender or admin (covers clearing a conversation).
drop policy if exists messages_delete on public.messages;
create policy messages_delete on public.messages for delete
  using (sender_id = auth.uid() or recipient_id = auth.uid() or public.is_super_admin());

-- ---- Storage bucket for chat file attachments ----
insert into storage.buckets (id, name, public)
values ('chat-files', 'chat-files', true)
on conflict (id) do update set public = true;

drop policy if exists "chat upload" on storage.objects;
create policy "chat upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'chat-files');

drop policy if exists "chat read" on storage.objects;
create policy "chat read" on storage.objects
  for select using (bucket_id = 'chat-files');


-- ============================== messages_notify.sql ==============================
-- ============================================================================
-- ADIMS — Wire new direct messages into the notification bell
--
-- messages-app.tsx sends DMs directly from the browser (RLS-scoped client),
-- so it cannot call the service-role lib/notify.ts helper. This trigger does
-- the equivalent server-side: every new message with a recipient gets a
-- matching row in `notifications`, which components/notification-bell.tsx
-- already polls and renders.
--
-- Run AFTER messages_dm.sql. Safe to re-run.
-- ============================================================================

create or replace function public.notify_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  sender_name text;
begin
  if new.recipient_id is null then
    return new;
  end if;

  select full_name into sender_name from public.profiles where id = new.sender_id;

  insert into public.notifications (user_id, title, body, link)
  values (
    new.recipient_id,
    coalesce(sender_name, 'Someone') || ' sent you a message',
    coalesce(new.body, case when new.file_url is not null then 'Sent an attachment' else null end),
    '/messages'
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_new_message on public.messages;
create trigger trg_notify_new_message after insert on public.messages
  for each row execute function public.notify_new_message();


-- ============================== seed.sql ==============================
-- ============================================================================
-- Dawah Department (ASSDI) seed data — campuses, master course list, sample
-- batches, syllabus, assessments, resources and website feedback.
-- Safe to re-run. (Demo login accounts live in seed_demo_users.sql.)
-- ============================================================================

-- Campuses ------------------------------------------------------------------
insert into public.campuses (name, slug, address) values
  ('Kazi Bari Campus',           'kazibari', 'Kazi Bari, Dhaka'),
  ('Satarkul Campus',            'satarkul', 'Satarkul, Badda, Dhaka'),
  ('50 Katha Technical Campus',  '50-katha', '50 Katha, Dhaka')
on conflict (slug) do nothing;

-- Master course list (with abbreviations) -----------------------------------
insert into public.courses (name, abbreviation, category, duration_label, default_total_classes, campus_id)
select v.name, v.abbr, v.cat::course_category, v.dur, v.total,
       (select id from public.campuses where slug = v.campus_slug)
from (values
  ('Sail to Success English Language Program',          'SSELP',          'general', '3 months', 90,  'satarkul'),
  ('The Art of Creation',                               'AOC',            'general', '1 month',  30,  'kazibari'),
  ('Small Business Management Course',                  'SBMC',           'general', '2 months', 60,  'kazibari'),
  ('The Art of Sales & Marketing',                      'SM',             'general', '2 months', 60,  'kazibari'),
  ('As-Sunnah Gul-Jahara Bahar Khanam Driving School',  'Driving School', 'general', '1 month',  30,  '50-katha'),
  ('Mobile Repairing Course',                           'MRC',            'general', '3 months', 90,  '50-katha'),
  ('Refrigeration & Air Conditioning',                  'RAC',            'general', '3 months', 90,  '50-katha'),
  ('Welding & Fabrication',                             'W&F',            'general', '3 months', 90,  '50-katha'),
  ('Professional Cooking & Catering Management',        'PCCM',           'general', '3 months', 90,  '50-katha'),
  ('Professional Motor-Bike Technician Training',       'PMTT',           'general', '4 months', 120, '50-katha'),
  ('Dawah Class (Scholars & General)',                  'DAWAH',          'common',  '3 months', 75,  'satarkul'),
  ('Quran Academy (Tajweed & Recitation)',              'QURAN',          'common',  '3 months', 60,  'satarkul')
) as v(name, abbr, cat, dur, total, campus_slug)
where not exists (select 1 from public.courses c where c.abbreviation = v.abbr);

-- Sample syllabus for the Dawah course --------------------------------------
insert into public.syllabus_topics (course_id, sequence, title)
select (select id from public.courses where abbreviation = 'DAWAH'), s.seq, s.title
from (values
  (1,  'Month 1: Character & manners of the Da''i'),
  (2,  'Month 1: Wisdom (hikmah) & gentleness'),
  (3,  'Month 1: Strategies for family Dawah'),
  (4,  'Month 1: Methods of Dawah to non-Muslims'),
  (5,  'Month 2: Western culture & Muslim youth'),
  (6,  'Month 2: Answering atheism & skepticism'),
  (7,  'Month 2: Refuting propaganda against Islam'),
  (8,  'Month 2: Using media & technology'),
  (9,  'Month 3: Public speaking & body language'),
  (10, 'Month 3: Dawah through writing'),
  (11, 'Month 3: Field work & direct Dawah'),
  (12, 'Month 3: Organisation & management')
) as s(seq, title)
where exists (select 1 from public.courses where abbreviation = 'DAWAH')
  and not exists (
    select 1 from public.syllabus_topics t
    join public.courses c on c.id = t.course_id
    where c.abbreviation = 'DAWAH' and t.sequence = s.seq);

-- Sample syllabus for the Quran Academy --------------------------------------
insert into public.syllabus_topics (course_id, sequence, title)
select (select id from public.courses where abbreviation = 'QURAN'), s.seq, s.title
from (values
  (1, 'Makharij: the points of articulation'),
  (2, 'Noon Sakinah & Tanween rules'),
  (3, 'Meem Sakinah rules'),
  (4, 'Rules of Madd (elongation)'),
  (5, 'Qalqalah & heavy/light letters'),
  (6, 'Fluency & melodious recitation practice')
) as s(seq, title)
where exists (select 1 from public.courses where abbreviation = 'QURAN')
  and not exists (
    select 1 from public.syllabus_topics t
    join public.courses c on c.id = t.course_id
    where c.abbreviation = 'QURAN' and t.sequence = s.seq);

-- Sample batches ------------------------------------------------------------
insert into public.batches
  (course_id, batch_no, duration_label, start_date, farewell_date,
   total_classes, completed_classes, midterm_status, final_status, status)
select c.id, v.batch_no, v.dur, v.start::date, v.farewell::date,
       v.total, v.done, v.mid::exam_status, v.fin::exam_status, v.st::batch_status
from (values
  ('SSELP', '01', '3 months', '2026-04-01', '2026-06-30', 90,  52, 'done',    'none',    'ongoing'),
  ('AOC',   '02', '1 month',  '2026-04-10', '2026-05-10', 30,  30, 'done',    'done',    'completed'),
  ('PMTT',  '01', '4 months', '2026-03-15', '2026-07-15', 120, 38, 'pending', 'none',    'ongoing'),
  ('DAWAH', '03', '3 months', '2026-05-01', '2026-07-30', 75,  18, 'none',    'none',    'ongoing'),
  ('QURAN', '02', '3 months', '2026-05-05', '2026-08-05', 60,  6,  'none',    'none',    'ongoing'),
  ('MRC',   '04', '3 months', '2026-07-01', '2026-09-30', 90,  0,  'none',    'none',    'will_start'),
  ('RAC',   '02', '3 months', '2026-02-01', '2026-04-30', 90,  90, 'done',    'done',    'completed')
) as v(abbr, batch_no, dur, start, farewell, total, done, mid, fin, st)
join public.courses c on c.abbreviation = v.abbr
where not exists (
  select 1 from public.batches b
  where b.course_id = c.id and b.batch_no = v.batch_no);

-- Entry/peer/exit assessments for the ongoing/completed batches -------------
insert into public.assessments (batch_id, type, is_done)
select b.id, a.type::assessment_type, a.done
from (values
  ('SSELP', '01', 'entry', true),
  ('SSELP', '01', 'peer',  true),
  ('SSELP', '01', 'exit',  false),
  ('AOC',   '02', 'entry', true),
  ('AOC',   '02', 'peer',  true),
  ('AOC',   '02', 'exit',  true),
  ('PMTT',  '01', 'entry', true),
  ('PMTT',  '01', 'peer',  false),
  ('PMTT',  '01', 'exit',  false)
) as a(abbr, batch_no, type, done)
join public.courses c on c.abbreviation = a.abbr
join public.batches b on b.course_id = c.id and b.batch_no = a.batch_no
on conflict (batch_id, type) do nothing;

-- Resource center (no uploader — public/admin library) -----------------------
insert into public.resources (title, type, url, course_id)
select v.title, v.type::resource_type, v.url,
       (select id from public.courses where abbreviation = v.abbr)
from (values
  ('Dawah Field Handbook (PDF)',          'pdf',   'https://example.com/dawah-handbook.pdf', 'DAWAH'),
  ('Public Speaking Slides',              'slide', 'https://example.com/speaking.pdf',       'DAWAH'),
  ('Tajweed Rules — Quick Reference',     'pdf',   'https://example.com/tajweed.pdf',        'QURAN'),
  ('Recitation Demo (Video)',             'video', 'https://example.com/recitation',         'QURAN'),
  ('Riyad as-Salihin (Book)',             'book',  'https://example.com/riyad',              NULL),
  ('As-Sunnah Foundation — Website',      'link',  'https://assunnahfoundation.org',         NULL)
) as v(title, type, url, abbr)
where not exists (select 1 from public.resources r where r.title = v.title);

-- Website feedback / complaints ---------------------------------------------
insert into public.feedback (name, phone, message, is_read)
select v.name, v.phone, v.message, v.is_read
from (values
  ('Rahim Uddin',   '01711-000001', 'Jazakum Allahu khairan. The English program changed my career, alhamdulillah.', false),
  ('Anonymous',     null,           'Please add an evening batch for the Quran Academy.', false),
  ('Fatima Akter',  '01822-000002', 'The driving school instructors are very professional and patient.', true),
  ('Yusuf Islam',   '01933-000003', 'Requesting a Dawah class in the Mirpur area as well, in sha Allah.', false)
) as v(name, phone, message, is_read)
where not exists (select 1 from public.feedback f where f.message = v.message);


-- ============================== 05_task_allocation.sql ==============================
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


-- ============================== 06_task_allocation_v2.sql ==============================
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


-- ============================== 07_task_submissions.sql ==============================
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


-- ============================== 08_campus_routine.sql ==============================
-- ============================================================================
-- ADIMS — Campus-wise Weekly Routine (ক্যাম্পাস-ওয়াইজ রুটিন)
--
-- One routine record per batch. Each record carries the weekly Quran-class and
-- Dawah-class timings plus the weekdays each class runs on. The public viewer
-- (Teachers / Staff / anyone) reads these to render the glassmorphic weekly
-- grid; only Super Admins and Campus Coordinators may write.
--
-- Day indices: 0 = Saturday … 5 = Thursday (Friday is the weekly holiday and is
-- intentionally omitted from the grid). Stored as int[] so a class can run on
-- several days.
--
-- `campus_id` is denormalised off the batch so RLS and the campus filter never
-- need a join. Run AFTER 07_task_submissions.sql. Safe to re-run.
-- ============================================================================

create table if not exists public.campus_routines (
  id           uuid primary key default gen_random_uuid(),
  -- One routine per batch — upserted on this column from the builder.
  batch_id     uuid not null unique references public.batches (id) on delete cascade,
  -- Denormalised campus for the RLS check and the viewer's campus filter.
  campus_id    uuid references public.campuses (id) on delete set null,
  -- Quran class: start/end time + the weekdays it runs (0=Sat … 5=Thu).
  quran_start  time,
  quran_end    time,
  quran_days   int[] not null default '{}',
  -- Dawah class: start/end time + the weekdays it runs.
  dawah_start  time,
  dawah_end    time,
  dawah_days   int[] not null default '{}',
  note         text,
  updated_by   uuid references public.profiles (id) on delete set null,
  updated_at   timestamptz not null default now()
);

create index if not exists idx_routine_campus on public.campus_routines (campus_id);
create index if not exists idx_routine_batch  on public.campus_routines (batch_id);

alter table public.campus_routines enable row level security;

-- Read: everyone (the viewer is public / view-only for all roles).
drop policy if exists routine_read on public.campus_routines;
create policy routine_read on public.campus_routines for select using (true);

-- Write: super_admin anywhere.
drop policy if exists routine_admin on public.campus_routines;
create policy routine_admin on public.campus_routines for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- Write: coordinator only within their assigned campus.
drop policy if exists routine_coordinator on public.campus_routines;
create policy routine_coordinator on public.campus_routines for all
  using (public.is_coordinator_of_campus(campus_id))
  with check (public.is_coordinator_of_campus(campus_id));

-- Verify:
--   select batch_id, campus_id, quran_start, quran_days, dawah_start, dawah_days
--   from public.campus_routines order by updated_at desc;


-- ============================== 09_teacher_resources.sql ==============================
-- ============================================================================
-- ADIMS — Teacher-wise Resource Center
--
-- A private, per-teacher document store (separate from the shared Dawah library
-- in `public.resources`). Each teacher uploads, replaces and deletes ONLY their
-- own files; Super Admins see everything, Campus Coordinators see the resources
-- of teachers in their campus(es).
--
-- Adds:
--   1. `public.teacher_resources` — one row per uploaded document/asset. We keep
--      the storage object key (`file_path`) alongside the public URL so the
--      replace/delete Server Actions can remove the old object and prevent
--      storage bloat.
--   2. The `teacher-resources` storage bucket, capped at 50 MB per file.
--
-- Run AFTER 07_task_submissions.sql. Safe to re-run.
-- ============================================================================

create table if not exists public.teacher_resources (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.profiles (id) on delete cascade,
  -- Campus the resource belongs to (drives the coordinator's read scope and the
  -- admin dashboard's campus filter). Captured from the teacher's campus at
  -- upload time; null when the teacher has no campus assignment.
  campus_id   uuid references public.campuses (id) on delete set null,
  name        text not null,                 -- display name of the document/asset
  comments    text,                          -- optional description / remarks
  file_url    text not null,                 -- public URL in the teacher-resources bucket
  file_path   text not null,                 -- storage object key (for overwrite/delete)
  file_name   text,                          -- original file name
  file_size   bigint,                        -- bytes (backend size guard mirrors the 50 MB cap)
  file_type   text,                          -- MIME type reported by the browser
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_tres_teacher on public.teacher_resources (teacher_id);
create index if not exists idx_tres_campus  on public.teacher_resources (campus_id);

alter table public.teacher_resources enable row level security;

-- super_admin: everything.
drop policy if exists tres_admin on public.teacher_resources;
create policy tres_admin on public.teacher_resources for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- teacher (owner): full CRUD over their own resources only.
drop policy if exists tres_owner on public.teacher_resources;
create policy tres_owner on public.teacher_resources for all
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

-- coordinator: read-only over resources of their campus(es), for the dashboard.
drop policy if exists tres_coordinator_read on public.teacher_resources;
create policy tres_coordinator_read on public.teacher_resources for select
  using (public.is_coordinator_of_campus(campus_id));

-- ----------------------------------------------------------------------------
-- Storage bucket — 50 MB per-file cap (52428800 bytes) enforced at the source.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('teacher-resources', 'teacher-resources', true, 52428800)
on conflict (id) do update set public = true, file_size_limit = 52428800;

drop policy if exists "teacher-resources upload" on storage.objects;
create policy "teacher-resources upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'teacher-resources');

drop policy if exists "teacher-resources read" on storage.objects;
create policy "teacher-resources read" on storage.objects
  for select using (bucket_id = 'teacher-resources');

drop policy if exists "teacher-resources delete" on storage.objects;
create policy "teacher-resources delete" on storage.objects
  for delete to authenticated using (bucket_id = 'teacher-resources');

-- Verify:
--   select id, teacher_id, campus_id, name, file_name, file_size
--   from public.teacher_resources order by created_at desc;


-- ============================== 10_campus_course_access.sql ==============================
-- ============================================================================
-- ADIMS — Campuses & Courses: page-level write access
--
-- The "Campuses & Courses" page (/admin/campuses) is Super-Admin-only by
-- default, but the Super Admin can hand it to an individual member from the
-- Access Management page (a user_page_access row). For that grant to be
-- functional — not just a visible sidebar link — the granted member must also
-- be able to write to campuses/courses. This migration relaxes the write RLS
-- on those two tables from "super_admin only" to "super_admin OR has an
-- explicit /admin/campuses page grant".
--
-- Safe to re-run.
-- ============================================================================

-- True when the current user is a super_admin OR was explicitly granted the
-- given sidebar page from Access Management (user_page_access).
create or replace function public.has_page_access(p_href text)
returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_super_admin() or exists (
    select 1 from public.user_page_access u
    where u.profile_id = auth.uid() and u.href = p_href
  );
$$;

-- campuses: writable by super_admin or a /admin/campuses page grantee.
drop policy if exists campuses_admin on public.campuses;
create policy campuses_admin on public.campuses for all
  using (public.has_page_access('/admin/campuses'))
  with check (public.has_page_access('/admin/campuses'));

-- courses: same — course create/assign now lives on the campus detail page.
drop policy if exists courses_admin on public.courses;
create policy courses_admin on public.courses for all
  using (public.has_page_access('/admin/campuses'))
  with check (public.has_page_access('/admin/campuses'));

-- Verify:
--   select public.has_page_access('/admin/campuses');


-- ============================== 11_amali_date_range.sql ==============================
-- ============================================================================
-- ADIMS — Amali: date-range tracking (start_date / end_date)
--
-- Replaces manual "sequence" ordering with an admin-set Start/End Date
-- cycle per routine:
--   - active/running  → today falls within [start_date, end_date]
--                        (either bound may be null = open-ended)
--   - completed       → end_date is set and has passed
--
-- Items are now ordered by start_date/created_at instead of sequence.
--
-- Run after amali.sql and amali_campus.sql. Safe to re-run.
-- ============================================================================

alter table public.amali_items
  add column if not exists start_date date,
  add column if not exists end_date date;

alter table public.amali_items drop column if exists sequence;

create index if not exists idx_amali_items_end_date on public.amali_items (end_date);


-- ============================== 12_feedback_open_read.sql ==============================
-- ============================================================================
-- ADIMS — Open read access on Feedback & Complaints
--
-- The Contact & Feedback admin inbox (app/(app)/admin/feedback) is now open
-- to every logged-in teacher/coordinator/admin so anyone on the team can
-- monitor community inquiries — not just Super Admins and Coordinators
-- (feedback_admin_review.sql). This widens the SELECT policy to any
-- authenticated profile. Mark-as-read and delete stay restricted to Super
-- Admin / Coordinator (feedback_admin_update / feedback_admin_delete,
-- unchanged) so members can view but not moderate the inbox.
--
-- Run AFTER 11_amali_date_range.sql. Safe to re-run.
-- ============================================================================

drop policy if exists feedback_admin on public.feedback;
create policy feedback_admin on public.feedback for select
  using (public.current_role() is not null);


-- ============================== 13_weekly_lesson_plan.sql ==============================
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


-- ============================== 14_syllabus_library.sql ==============================
-- ============================================================================
-- ADIMS — Syllabus Library (course-independent)
--
-- Replaces the per-course syllabus PDF upload (syllabus.sql's
-- resources.syllabus_kind) with a standalone list the Super Admin manages
-- directly: add a named syllabus entry, upload/replace its PDF, delete it.
-- No link to any course — categories are freeform (e.g. General students,
-- Alem students, Quran — cannot read / moderate / good).
--
-- Run after 13_weekly_lesson_plan.sql. Safe to re-run.
-- ============================================================================

create table if not exists public.syllabus_documents (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  url        text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_syllabus_documents_sort on public.syllabus_documents (sort_order);

alter table public.syllabus_documents enable row level security;

-- Read: public (even anon) — shown on the public academic page.
drop policy if exists syllabus_documents_read on public.syllabus_documents;
create policy syllabus_documents_read on public.syllabus_documents
  for select using (true);
grant select on public.syllabus_documents to anon;

-- Write: Super Admin only.
drop policy if exists syllabus_documents_admin on public.syllabus_documents;
create policy syllabus_documents_admin on public.syllabus_documents for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- Seed the initial categories described by the Super Admin. Skipped if the
-- table already has rows (e.g. re-running this file after seeding).
insert into public.syllabus_documents (title, sort_order)
select v.title, v.sort_order
from (values
  ('জেনারেল শিক্ষার্থী সিলেবাস', 1),
  ('আলেম শিক্ষার্থী সিলেবাস', 2),
  ('কুরআন সিলেবাস (যারা কুরআন পড়তে পারে না)', 3),
  ('কুরআন সিলেবাস (মোটামুটি পড়তে পারে)', 4),
  ('কুরআন সিলেবাস (ভালো পড়তে পারে)', 5)
) as v(title, sort_order)
where not exists (select 1 from public.syllabus_documents);

-- The old course-wise syllabus columns/policy are no longer written to by the
-- app but are left in place (existing uploaded PDFs, if any, are untouched).
-- Drop manually later if you're sure nothing else needs them:
--   alter table public.resources drop column if exists syllabus_kind;
--   drop policy if exists res_syllabus_public_read on public.resources;


-- ============================== notifications_cron.sql ==============================
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
