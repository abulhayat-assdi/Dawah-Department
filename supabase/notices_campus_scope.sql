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
