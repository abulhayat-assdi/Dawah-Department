-- ============================================================================
-- ADIMS — Resource Center file storage bucket
--
-- Public-read bucket for resource files (slides, PDFs, books). Authenticated
-- users (the coordinator) upload; the public URL is stored on resources.url.
--
-- Safe to re-run.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('resources', 'resources', true)
on conflict (id) do update set public = true;

drop policy if exists "resources upload" on storage.objects;
create policy "resources upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'resources');

drop policy if exists "resources read" on storage.objects;
create policy "resources read" on storage.objects
  for select using (bucket_id = 'resources');

drop policy if exists "resources delete" on storage.objects;
create policy "resources delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'resources');
