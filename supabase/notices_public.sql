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
