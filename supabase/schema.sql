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
       else null end as days_left
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
