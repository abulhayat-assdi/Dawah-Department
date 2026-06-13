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
