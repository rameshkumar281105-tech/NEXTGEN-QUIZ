-- ============================================================================
-- Migration: allow any signed-in user to create quizzes (not just
-- professor/admin). Run this once in the Supabase SQL editor if you already
-- ran the original schema.sql — new projects get this via schema.sql already.
-- ============================================================================

drop policy if exists "quizzes_insert" on quizzes;

create policy "quizzes_insert" on quizzes for insert to authenticated
  with check (creator_id = auth.uid());

