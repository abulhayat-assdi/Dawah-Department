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
