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
