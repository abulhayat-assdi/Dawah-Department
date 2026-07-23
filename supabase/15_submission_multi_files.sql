-- ============================================================================
-- ADIMS — Multiple attachments per task submission
--
-- Adds a `files` JSONB column to `task_submissions` so an Other-Task submission
-- can carry any number of attachments instead of a single `file_url`. Each
-- element is `{ "url": <public url>, "name": <display name> }`. The legacy
-- `file_url` / `file_name` columns are kept for backward compatibility (older
-- rows and the single-file Form-Verification upload still populate them); the
-- app merges both when displaying.
--
-- Run AFTER 07_task_submissions.sql. Safe to re-run.
-- ============================================================================

alter table public.task_submissions
  add column if not exists files jsonb not null default '[]'::jsonb;

-- Verify:
--   select id, class_type, file_url, files from public.task_submissions
--   order by created_at desc;
