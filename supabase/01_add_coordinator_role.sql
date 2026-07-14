-- ============================================================================
-- ADIMS — Step 1 of 2 for the Coordinator role.
--
-- IMPORTANT: Run ONLY this one statement by itself in the SQL Editor (its own
-- "Run"), separate from every other migration. Postgres does not allow
-- `ALTER TYPE ... ADD VALUE` to run in the same multi-statement script as
-- other commands — if you paste this together with other SQL, the whole
-- script fails and nothing after it gets created (this is exactly what
-- happened when sheds_and_roles.sql was run as one block).
--
-- After this succeeds on its own, move on to 02_coordinator_and_batches.sql.
-- ============================================================================

alter type public.user_role add value if not exists 'coordinator';
