-- ============================================================================
-- ADIMS — "Last dawah-class date" on batches
--
-- Adds dawah_end_date (the last date dawah classes are taken) which sits
-- before the farewell date. Safe to re-run.
-- ============================================================================

alter table public.batches add column if not exists dawah_end_date date;
