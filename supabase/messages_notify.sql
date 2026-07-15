-- ============================================================================
-- ADIMS — Wire new direct messages into the notification bell
--
-- messages-app.tsx sends DMs directly from the browser (RLS-scoped client),
-- so it cannot call the service-role lib/notify.ts helper. This trigger does
-- the equivalent server-side: every new message with a recipient gets a
-- matching row in `notifications`, which components/notification-bell.tsx
-- already polls and renders.
--
-- Run AFTER messages_dm.sql. Safe to re-run.
-- ============================================================================

create or replace function public.notify_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  sender_name text;
begin
  if new.recipient_id is null then
    return new;
  end if;

  select full_name into sender_name from public.profiles where id = new.sender_id;

  insert into public.notifications (user_id, title, body, link)
  values (
    new.recipient_id,
    coalesce(sender_name, 'Someone') || ' sent you a message',
    coalesce(new.body, case when new.file_url is not null then 'Sent an attachment' else null end),
    '/messages'
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_new_message on public.messages;
create trigger trg_notify_new_message after insert on public.messages
  for each row execute function public.notify_new_message();
