-- ============================================================================
-- ADIMS — Amali: campus-scoped routines
--
-- amali_items.campus_id : null = a global routine (visible to everyone, as
--   before); non-null = a routine specific to one campus, manageable by that
--   campus's coordinator(s). The teacher-personal checklist at /my/amali is
--   unchanged — it still shows every active item regardless of campus_id.
--
-- Run after schema.sql, amali.sql, 01_add_coordinator_role.sql AND
-- 02_coordinator_and_batches.sql. Safe to re-run.
-- ============================================================================

alter table public.amali_items
  add column if not exists campus_id uuid references public.campuses (id) on delete cascade;

create index if not exists idx_amali_items_campus on public.amali_items (campus_id);

drop policy if exists amali_items_coordinator on public.amali_items;
create policy amali_items_coordinator on public.amali_items for all
  using (campus_id is not null and public.is_coordinator_of_campus(campus_id))
  with check (campus_id is not null and public.is_coordinator_of_campus(campus_id));
