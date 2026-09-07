-- ============================================================================
-- Migration: let a quiz have a bigger question bank than it actually asks
-- per attempt. Run this once in the Supabase SQL editor if you already ran
-- the original schema.sql — new projects get this via schema.sql already.
--
-- With this column set, each attempt (solo play) randomly samples that many
-- questions from the quiz's full question bank, and always shuffles their
-- order — so repeat plays of the same quiz feel different. Leave it null
-- (the default) to keep using every question, just in shuffled order.
-- ============================================================================

alter table quizzes add column if not exists questions_per_attempt integer;
