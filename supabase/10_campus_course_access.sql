-- ============================================================================
-- ADIMS — Campuses & Courses: page-level write access
--
-- The "Campuses & Courses" page (/admin/campuses) is Super-Admin-only by
-- default, but the Super Admin can hand it to an individual member from the
-- Access Management page (a user_page_access row). For that grant to be
-- functional — not just a visible sidebar link — the granted member must also
-- be able to write to campuses/courses. This migration relaxes the write RLS
-- on those two tables from "super_admin only" to "super_admin OR has an
-- explicit /admin/campuses page grant".
--
-- Safe to re-run.
-- ============================================================================

-- True when the current user is a super_admin OR was explicitly granted the
-- given sidebar page from Access Management (user_page_access).
create or replace function public.has_page_access(p_href text)
returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_super_admin() or exists (
    select 1 from public.user_page_access u
    where u.profile_id = auth.uid() and u.href = p_href
  );
$$;

-- campuses: writable by super_admin or a /admin/campuses page grantee.
drop policy if exists campuses_admin on public.campuses;
create policy campuses_admin on public.campuses for all
  using (public.has_page_access('/admin/campuses'))
  with check (public.has_page_access('/admin/campuses'));

-- courses: same — course create/assign now lives on the campus detail page.
drop policy if exists courses_admin on public.courses;
create policy courses_admin on public.courses for all
  using (public.has_page_access('/admin/campuses'))
  with check (public.has_page_access('/admin/campuses'));

-- Verify:
--   select public.has_page_access('/admin/campuses');
