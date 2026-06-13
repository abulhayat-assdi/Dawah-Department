-- ============================================================================
-- ADIMS — Avatars (profile photo) storage bucket
--
-- Public-read bucket for member profile photos. Authenticated users upload;
-- anyone can read (public URLs are stored on profiles.photo_url and shown on
-- the public Member Portfolios page).
--
-- Safe to re-run.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "avatars upload" on storage.objects;
create policy "avatars upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars');

drop policy if exists "avatars update" on storage.objects;
create policy "avatars update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars');

drop policy if exists "avatars read" on storage.objects;
create policy "avatars read" on storage.objects
  for select using (bucket_id = 'avatars');
