-- ============================================================================
-- ADIMS — Internal communication (text + voice messages)
--
-- A single shared team channel for the Dawah Department members. Voice notes
-- are uploaded to the `voice-messages` storage bucket; the public URL is stored
-- on the message row for playback.
--
-- Safe to re-run.
-- ============================================================================

create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  body       text,
  audio_url  text,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_created on public.messages (created_at);

alter table public.messages enable row level security;

-- Everyone authenticated reads the channel.
drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages
  for select using (auth.uid() is not null);

-- A member posts as themselves.
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert with check (sender_id = auth.uid());

-- Sender (or admin) may delete.
drop policy if exists messages_delete on public.messages;
create policy messages_delete on public.messages
  for delete using (sender_id = auth.uid() or public.is_super_admin());

-- ----------------------------------------------------------------------------
-- Storage bucket for voice notes. Public-read (unguessable UUID filenames),
-- authenticated-write. Run in the SQL editor; or create the bucket via
-- Dashboard → Storage and add the two policies below.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('voice-messages', 'voice-messages', true)
on conflict (id) do update set public = true;

drop policy if exists "voice upload" on storage.objects;
create policy "voice upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'voice-messages');

drop policy if exists "voice read" on storage.objects;
create policy "voice read" on storage.objects
  for select using (bucket_id = 'voice-messages');
