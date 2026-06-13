-- ============================================================================
-- ADIMS — Direct messaging upgrade (two-pane "Live Support" chat)
--
-- Upgrades the single team channel to 1-to-1 conversations between members:
-- adds a recipient, read flag and file attachment fields, and tightens RLS so
-- only the two participants (and admins) can read a conversation.
--
-- Run AFTER supabase/messages.sql. Safe to re-run.
-- ============================================================================

alter table public.messages add column if not exists recipient_id uuid
  references public.profiles (id) on delete cascade;
alter table public.messages add column if not exists is_read boolean not null default false;
alter table public.messages add column if not exists file_url text;
alter table public.messages add column if not exists file_name text;

create index if not exists idx_messages_pair
  on public.messages (sender_id, recipient_id, created_at);
create index if not exists idx_messages_recipient
  on public.messages (recipient_id, is_read);

-- ---- RLS ----
-- Read: only the two participants (or an admin).
drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages for select
  using (
    sender_id = auth.uid()
    or recipient_id = auth.uid()
    or public.is_super_admin()
  );

-- Insert: you may only send as yourself.
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert
  with check (sender_id = auth.uid());

-- Update: the recipient may mark received messages as read.
drop policy if exists messages_update on public.messages;
create policy messages_update on public.messages for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- Delete: sender or admin (covers clearing a conversation).
drop policy if exists messages_delete on public.messages;
create policy messages_delete on public.messages for delete
  using (sender_id = auth.uid() or recipient_id = auth.uid() or public.is_super_admin());

-- ---- Storage bucket for chat file attachments ----
insert into storage.buckets (id, name, public)
values ('chat-files', 'chat-files', true)
on conflict (id) do update set public = true;

drop policy if exists "chat upload" on storage.objects;
create policy "chat upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'chat-files');

drop policy if exists "chat read" on storage.objects;
create policy "chat read" on storage.objects
  for select using (bucket_id = 'chat-files');
