-- ============================================================================
-- ADIMS — Public Member Portfolios view
--
-- Exposes ONLY safe columns of active members to anonymous visitors for the
-- public "Members" page. The base profiles table stays locked down (its RLS
-- requires auth); this view is explicitly granted to the anon role.
--
-- Safe to re-run.
-- ============================================================================

create or replace view public.public_members
with (security_invoker = off) as
select
  p.id,
  p.full_name,
  p.designation,
  p.photo_url,
  p.bio,
  p.background,
  p.location
from public.profiles p
where p.is_active = true
order by p.full_name;

grant select on public.public_members to anon, authenticated;
