# ADIMS — Handover Guide

**ADIMS** (AsSDI Dawah Department Integrated Management System) — a Next.js 16 + Supabase app
for managing the Dawah Department's campuses, courses, batches, members and public website.

---

## 1. Environment variables

Create `.env.local` (and set the same in your host, e.g. Vercel):

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # server-only; never expose to the browser
```

Find these in Supabase → Project Settings → API.

## 2. Database setup (run SQL in this order)

Open Supabase → **SQL Editor** and run each file from the `supabase/` folder, in order:

1. `schema.sql` — tables, enums, RLS, triggers, `course_tracker` view
2. `notices.sql` — Notice Board
3. `amali.sql` — Amali (daily practice) checklist
4. `messages.sql` — internal messaging + `voice-messages` bucket
5. `notifications_cron.sql` — missed-report reminder (needs the **pg_cron** extension; enable it
   under Database → Extensions first)
6. `avatars.sql` — profile photo bucket
7. `public_site.sql` — public Members view (anon-readable)
8. `site_content.sql` — public pages CMS storage
9. `resources_bucket.sql` — Resource Center file bucket
10. `faculty.sql` — public Faculty list (CMS-managed)
11. `campus_image.sql` — campus image + public read of campuses/courses
12. `batch_student_count.sql` — active student count per batch + public read of batches
13. `notices_public.sql` — coordinators can post notices
14. `feedback_admin_review.sql` — coordinators can read/mark-read/delete feedback
15. `messages_notify.sql` — new direct messages raise an in-app notification
16. `make_super_admin.sql` — promote your account (see step 4)
17. `notices_campus_scope.sql` — Notice Board is member-only (no public/anon read) and
    campus-scoped (a notice targets one campus or "all campuses"). **Requires**
    `01_add_coordinator_role.sql` and `02_coordinator_and_batches.sql` to have been run first
    (needs `is_coordinator_of_campus()`).

> Upgrading an existing DB that predates the velocity projection? Also run `projection.sql`.
>
> Note: this list doesn't yet cover every file in `supabase/` (e.g. `01_add_coordinator_role.sql`,
> `02_coordinator_and_batches.sql`, `messages_dm.sql`, `syllabus.sql`, `class_schedule.sql`,
> `staff_tracker.sql`, `amali_campus.sql`, `batch_dawah_date.sql`) — check the folder and run any
> file relevant to features you've enabled, in the order implied by their comments.

## 3. Storage buckets

The SQL above creates buckets `voice-messages`, `avatars`, `resources` automatically. Confirm
they exist under Supabase → **Storage** (all are public-read, authenticated-write).

## 4. Create the first Super Admin

1. Supabase → Authentication → Users → **Add user** → enter your email + password, tick
   **Auto Confirm User**.
2. Edit `supabase/make_super_admin.sql`, replace the email, and run it. That account is now the
   coordinator (super_admin) and can manage everything from `/admin/...`.
3. Further members can be created inside the app at **Teachers / Members → Add New Member**.

## 5. Run / build

```
npm install
npm run dev      # local development → http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
```

## 6. What the app includes

- **Public website** (no login): Home, About, Faculty (+ per-teacher profiles), Academic,
  Dawah Activities (campuses) and Contact — all text/images editable by the admin under
  **Public Pages** (rich-text CMS) and **Faculty (Public)**. The header's gold button is
  **"Login as Teacher"** → the internal portal.
- **Coordinator (super_admin) panel**: Dashboard, Course Progress Tracker, Campuses (with
  campus → batch drill-down), Teachers/Members (full management: edit, role, campuses, photo
  upload, password reset, deactivate, delete), Courses & Syllabus, Batches, Tasks, Amali,
  Reports (+ one-click monthly **PDF/Word** export), Resource Center (file upload), Public Pages
  (CMS), Messages, Feedback, Notice Board.
- **Member (teacher) portal**: Dashboard, My Batches, My Tasks, Amali checklist, Daily Report,
  Messages, My Profile (with photo upload).
- **Automation**: in-app notifications (unread counts badged on the sidebar entry the
  notification's `link` points at — see `lib/nav.ts` `matchNavHref`; opening the page clears
  its badge), evening missed-report reminder (pg_cron),
  topic-completion confirmation notifications, velocity-based completion projection.

## 7. Notes

- Monthly report Bengali rendering relies on the bundled fonts in `lib/reports/fonts/` — keep that
  folder in deployments.
- All access is enforced by Supabase Row Level Security; the service-role key is used only in
  trusted server actions.
