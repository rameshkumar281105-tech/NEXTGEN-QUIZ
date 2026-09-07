-- ============================================================================
-- Run this ONCE if you're getting "policy ... already exists" errors while
-- re-running schema.sql. It drops every policy schema.sql creates, so you
-- can safely re-run schema.sql (or just the RLS section) afterward without
-- conflicts. Safe to run even if some of these policies don't exist yet —
-- "if exists" makes each drop a no-op in that case.
-- ============================================================================

drop policy if exists "profiles_select_authenticated" on profiles;
drop policy if exists "profiles_insert_self" on profiles;
drop policy if exists "profiles_update_self_or_admin" on profiles;
drop policy if exists "profiles_delete_admin" on profiles;

drop policy if exists "quizzes_select" on quizzes;
drop policy if exists "quizzes_insert" on quizzes;
drop policy if exists "quizzes_update" on quizzes;
drop policy if exists "quizzes_delete" on quizzes;

drop policy if exists "questions_select" on questions;
drop policy if exists "questions_insert" on questions;
drop policy if exists "questions_update" on questions;
drop policy if exists "questions_delete" on questions;

drop policy if exists "attempts_select" on quiz_attempts;
drop policy if exists "attempts_insert" on quiz_attempts;
drop policy if exists "attempts_delete_admin" on quiz_attempts;

drop policy if exists "answers_select" on answers;
drop policy if exists "answers_insert" on answers;

drop policy if exists "games_select" on multiplayer_games;
drop policy if exists "games_insert" on multiplayer_games;
drop policy if exists "games_update" on multiplayer_games;
drop policy if exists "games_delete" on multiplayer_games;

drop policy if exists "players_select" on game_players;
drop policy if exists "players_delete" on game_players;

drop policy if exists "game_answers_select" on game_answers;

drop policy if exists "achievements_select" on achievements;
drop policy if exists "achievements_admin_write" on achievements;

drop policy if exists "user_achievements_select" on user_achievements;

drop policy if exists "rewards_select" on rewards;
drop policy if exists "rewards_admin_write" on rewards;

drop policy if exists "user_rewards_select" on user_rewards;
