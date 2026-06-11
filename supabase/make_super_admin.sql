-- ============================================================================
-- Dawah Department (ASSDI) — create your main Super Admin.
--
-- How to make the first super_admin (avoids the chicken-and-egg problem):
--   1) Go to Supabase Dashboard → Authentication → Users → "Add user",
--      enter your email + password and tick "Auto Confirm User".
--      (This creates the auth.users row and the trigger creates a profiles row.)
--   2) Replace the email below with yours and run this file in the SQL Editor.
--      It promotes that account to super_admin.
--
-- Safe to re-run.
-- ============================================================================

update public.profiles p
set role      = 'super_admin',
    full_name = case when p.full_name = '' then 'Main Coordinator' else p.full_name end
from auth.users u
where u.id = p.id
  and u.email = 'YOUR_EMAIL_HERE@example.com';   -- 👈 put your email here

-- Verify: run the line below separately to confirm the role is correct.
-- select u.email, p.role, p.full_name from public.profiles p
--   join auth.users u on u.id = p.id;
