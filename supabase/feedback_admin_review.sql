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
