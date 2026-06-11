-- ============================================================================
-- Dawah Department (ASSDI) — DEMO LOGIN ACCOUNTS for client preview.
--
-- Creates two real Supabase Auth users so the client can sign in and preview
-- BOTH experiences (no in-app role switcher is used, because RLS ties the role
-- to the logged-in account):
--
--   • Super Admin (Coordinator):  admin@assdi.edu    /  Admin@123
--   • Teacher / Member:           teacher@assdi.edu  /  Teacher@123
--
-- Run AFTER schema.sql and seed.sql. Safe to re-run.
--
-- NOTE: directly seeding auth.users is Supabase-version sensitive. If sign-in
-- fails, create the two users from Dashboard → Authentication → Users
-- ("Add user" + Auto Confirm), then run only the "Profiles & demo data" section
-- below (it matches users by email).
-- ============================================================================

-- Fixed UUIDs so the script is idempotent and re-runnable.
-- admin:   00000000-0000-0000-0000-0000000000a1
-- teacher: 00000000-0000-0000-0000-0000000000b2

-- ---- Auth users -----------------------------------------------------------
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password,
   email_confirmed_at, created_at, updated_at,
   raw_app_meta_data, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000',
   '00000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated',
   'admin@assdi.edu', crypt('Admin@123', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Main Coordinator","role":"super_admin"}'),
  ('00000000-0000-0000-0000-000000000000',
   '00000000-0000-0000-0000-0000000000b2', 'authenticated', 'authenticated',
   'teacher@assdi.edu', crypt('Teacher@123', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Akram Hossain","role":"teacher"}')
on conflict (id) do nothing;

-- ---- Auth identities (required for email/password sign-in) -----------------
insert into auth.identities
  (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a1',
   '{"sub":"00000000-0000-0000-0000-0000000000a1","email":"admin@assdi.edu","email_verified":true}',
   'email', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000b2',
   '{"sub":"00000000-0000-0000-0000-0000000000b2","email":"teacher@assdi.edu","email_verified":true}',
   'email', now(), now(), now())
on conflict (provider_id, provider) do nothing;

-- ============================================================================
-- Profiles & demo data  (matches users by email — safe even if the users were
-- created via the Dashboard instead of the inserts above).
-- ============================================================================

-- Make sure each profile has the right role/details. The on_auth_user_created
-- trigger inserts a base profile; here we enrich it.
update public.profiles p set
  role        = 'super_admin',
  full_name   = 'Main Coordinator',
  designation = 'Department Coordinator',
  phone       = '01700-000100',
  location    = 'Dhaka, Bangladesh',
  is_active   = true
from auth.users u
where u.id = p.id and u.email = 'admin@assdi.edu';

update public.profiles p set
  role        = 'teacher',
  full_name   = 'Akram Hossain',
  designation = 'Dawah Trainer',
  phone       = '01700-000200',
  location    = 'Badda, Dhaka',
  background  = 'Graduate of As-Sunnah madrasa; 4 years of field Dawah experience.',
  is_active   = true
from auth.users u
where u.id = p.id and u.email = 'teacher@assdi.edu';

-- Assign the teacher to the Satarkul campus.
insert into public.teacher_campuses (teacher_id, campus_id)
select (select id from auth.users where email = 'teacher@assdi.edu'),
       (select id from public.campuses where slug = 'satarkul')
on conflict do nothing;

-- Assign the teacher to the ongoing Dawah & Quran batches.
insert into public.batch_teachers (batch_id, teacher_id, role_label)
select b.id,
       (select id from auth.users where email = 'teacher@assdi.edu'),
       v.role_label
from (values
  ('DAWAH', '03', 'Dawah class'),
  ('QURAN', '02', 'Quran (Tajweed) class')
) as v(abbr, batch_no, role_label)
join public.courses c on c.abbreviation = v.abbr
join public.batches b on b.course_id = c.id and b.batch_no = v.batch_no
on conflict do nothing;

-- Tasks assigned by the coordinator to the teacher.
insert into public.tasks (title, description, assigned_to, assigned_by, status, priority, due_date)
select v.title, v.descr,
       (select id from auth.users where email = 'teacher@assdi.edu'),
       (select id from auth.users where email = 'admin@assdi.edu'),
       v.status::task_status, v.priority, v.due::date
from (values
  ('Prepare Dawah batch-03 midterm', 'Set the question paper and arrange the exam hall.', 'doing', 1, '2026-06-20'),
  ('Submit monthly counseling report', 'Consolidate May counseling figures.',            'todo', 0, '2026-06-15'),
  ('Update Quran batch-02 syllabus progress', 'Mark completed Tajweed topics.',           'todo', 0, '2026-06-18'),
  ('Collect student feedback forms', 'Gather exit feedback from AOC batch-02.',            'done', 0, '2026-06-05')
) as v(title, descr, status, priority, due)
where not exists (select 1 from public.tasks t where t.title = v.title);

-- A few daily reports from the teacher.
insert into public.daily_reports (teacher_id, report_date, work_hours, counseling_count, topics_covered, summary)
select (select id from auth.users where email = 'teacher@assdi.edu'),
       v.d::date, v.hrs, v.cc, v.topics, v.summ
from (values
  ('2026-06-10', 6.0, 5, 'Wisdom & gentleness in Dawah', 'Good engagement; two new students joined.'),
  ('2026-06-09', 5.5, 3, 'Character & manners of the Da''i', 'Covered chapter 1; assigned reading.'),
  ('2026-06-08', 4.0, 2, 'Tajweed: Noon Sakinah rules', 'Recitation practice with the Quran batch.')
) as v(d, hrs, cc, topics, summ)
where not exists (
  select 1 from public.daily_reports r
  where r.teacher_id = (select id from auth.users where email = 'teacher@assdi.edu')
    and r.report_date = v.d::date);
