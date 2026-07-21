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
