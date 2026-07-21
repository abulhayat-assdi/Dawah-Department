-- ============================================================================
-- ADIMS — Amali: date-range tracking (start_date / end_date)
--
-- Replaces manual "sequence" ordering with an admin-set Start/End Date
-- cycle per routine:
--   - active/running  → today falls within [start_date, end_date]
--                        (either bound may be null = open-ended)
--   - completed       → end_date is set and has passed
--
-- Items are now ordered by start_date/created_at instead of sequence.
--
-- Run after amali.sql and amali_campus.sql. Safe to re-run.
-- ============================================================================

alter table public.amali_items
  add column if not exists start_date date,
  add column if not exists end_date date;

alter table public.amali_items drop column if exists sequence;

create index if not exists idx_amali_items_end_date on public.amali_items (end_date);
