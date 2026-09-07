-- ============================================================================
-- NextGen Quiz — Supabase schema
-- Run this once in the Supabase SQL editor (or `supabase db push`) on a
-- fresh project, BEFORE running seed.sql.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- TABLES
-- ============================================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'New Player',
  email text not null,
  mobile text,
  address text,
  role text not null default 'student' check (role in ('student', 'professor', 'admin')),
  avatar text,
  xp integer not null default 0,
  level integer not null default 1,
  streak integer not null default 0,
  best_streak integer not null default 0,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  time_limit integer not null default 30,
  is_public boolean not null default true,
  published boolean not null default false,
  questions_per_attempt integer,
  created_at timestamptz not null default now()
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_answer text not null check (correct_answer in ('a', 'b', 'c', 'd')),
  explanation text,
  points integer not null default 10,
  question_order integer not null default 0
);

create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  quiz_id uuid not null references quizzes(id) on delete cascade,
  score integer not null default 0,
  percentage integer not null default 0,
  correct_answers integer not null default 0,
  wrong_answers integer not null default 0,
  unanswered integer not null default 0,
  time_taken integer not null default 0,
  xp_earned integer not null default 0,
  completed_at timestamptz not null default now()
);

create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references quiz_attempts(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  selected_answer text,
  is_correct boolean not null default false,
  points integer not null default 0,
  response_time numeric not null default 0
);

create table if not exists multiplayer_games (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  host_id uuid not null references profiles(id) on delete cascade,
  game_pin text not null unique,
  status text not null default 'lobby' check (status in ('lobby', 'active', 'finished')),
  current_question integer not null default 0,
  question_started_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references multiplayer_games(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  player_name text not null,
  score integer not null default 0,
  joined_at timestamptz not null default now(),
  unique (game_id, user_id)
);

create table if not exists game_answers (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references multiplayer_games(id) on delete cascade,
  player_id uuid not null references game_players(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  selected_answer text not null,
  is_correct boolean not null default false,
  points integer not null default 0,
  response_time numeric not null default 0,
  unique (game_id, player_id, question_id)
);

create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text not null,
  icon text not null default '🏆',
  requirement text not null
);

create table if not exists user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  achievement_id uuid not null references achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

create table if not exists rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  xp_required integer not null
);

create table if not exists user_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  reward_id uuid not null references rewards(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, reward_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

create index if not exists idx_quizzes_creator on quizzes(creator_id);
create index if not exists idx_quizzes_category on quizzes(category);
create index if not exists idx_quizzes_public_published on quizzes(is_public, published);
create index if not exists idx_questions_quiz on questions(quiz_id);
create index if not exists idx_attempts_user on quiz_attempts(user_id);
create index if not exists idx_attempts_quiz on quiz_attempts(quiz_id);
create index if not exists idx_answers_attempt on answers(attempt_id);
create index if not exists idx_games_pin on multiplayer_games(game_pin);
create index if not exists idx_games_host on multiplayer_games(host_id);
create index if not exists idx_players_game on game_players(game_id);
create index if not exists idx_game_answers_game on game_answers(game_id);
create index if not exists idx_user_achievements_user on user_achievements(user_id);
create index if not exists idx_user_rewards_user on user_rewards(user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function unlock_achievement(p_user_id uuid, p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_achievement_id uuid;
begin
  select id into v_achievement_id from achievements where code = p_code;
  if v_achievement_id is not null then
    insert into user_achievements (user_id, achievement_id)
    values (p_user_id, v_achievement_id)
    on conflict (user_id, achievement_id) do nothing;
  end if;
end;
$$;

create or replace function category_achievement_code(p_category text)
returns text
language sql
immutable
as $$
  select case p_category
    when 'Science' then 'science_master'
    when 'Technology' then 'technology_master'
    when 'History' then 'history_master'
    when 'Sports' then 'sports_master'
    when 'General Knowledge' then 'gk_master'
    else null
  end;
$$;

create or replace function sync_rewards(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_xp integer;
begin
  select xp into v_xp from profiles where id = p_user_id;
  insert into user_rewards (user_id, reward_id)
  select p_user_id, r.id from rewards r
  where r.xp_required <= v_xp
    and not exists (select 1 from user_rewards ur where ur.user_id = p_user_id and ur.reward_id = r.id);
end;
$$;

-- Auto-create a profile row whenever a new auth user is created.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
-- SOLO QUIZ: record completion, award XP/level/streak, check achievements
-- ============================================================================

create or replace function record_quiz_completion(
  p_user_id uuid,
  p_xp_earned integer,
  p_percentage integer,
  p_category text default null,
  p_avg_response_time numeric default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt_count integer;
  v_new_xp integer;
  v_new_streak integer;
  v_cat_count integer;
  v_cat_code text;
begin
  if p_user_id <> auth.uid() then
    raise exception 'not authorized';
  end if;

  select count(*) into v_attempt_count from quiz_attempts where user_id = p_user_id;

  update profiles
     set xp = xp + p_xp_earned,
         streak = streak + 1,
         best_streak = greatest(best_streak, streak + 1),
         level = greatest(1, floor((xp + p_xp_earned) / 500.0)::int + 1)
   where id = p_user_id
   returning xp, streak into v_new_xp, v_new_streak;

  if v_attempt_count + 1 = 1 then
    perform unlock_achievement(p_user_id, 'first_quiz');
  end if;

  if p_percentage = 100 then
    perform unlock_achievement(p_user_id, 'perfect_score');
  end if;

  if p_percentage >= 80 and p_avg_response_time is not null and p_avg_response_time <= 6 then
    perform unlock_achievement(p_user_id, 'speed_master');
  end if;

  if v_new_streak >= 5 then
    perform unlock_achievement(p_user_id, 'streak_5');
  end if;

  if v_new_streak >= 10 then
    perform unlock_achievement(p_user_id, 'streak_10');
  end if;

  if v_attempt_count + 1 >= 10 then
    perform unlock_achievement(p_user_id, 'quiz_champion');
  end if;

  if p_category is not null then
    v_cat_code := category_achievement_code(p_category);
    if v_cat_code is not null then
      select count(*) into v_cat_count
        from quiz_attempts qa join quizzes qz on qz.id = qa.quiz_id
       where qa.user_id = p_user_id and qz.category = p_category and qa.percentage >= 70;
      if v_cat_count >= 5 then
        perform unlock_achievement(p_user_id, v_cat_code);
      end if;
    end if;
  end if;

  perform sync_rewards(p_user_id);
end;
$$;

-- Reset a user's streak if they haven't played today (call opportunistically
-- from the client, or wire up a scheduled Supabase Edge Function / cron).
create or replace function reset_stale_streak(p_user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update profiles set streak = 0
  where id = p_user_id
    and not exists (
      select 1 from quiz_attempts
      where user_id = p_user_id and completed_at > now() - interval '2 days'
    );
$$;

-- ============================================================================
-- MULTIPLAYER: create / join / start / advance / answer
-- ============================================================================

create or replace function create_multiplayer_game(p_quiz_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pin text;
  v_game_id uuid;
begin
  if not exists (
    select 1 from quizzes where id = p_quiz_id and (creator_id = auth.uid() or is_admin())
  ) then
    raise exception 'not authorized to host this quiz';
  end if;

  loop
    v_pin := lpad(floor(random() * 1000000)::text, 6, '0');
    exit when not exists (
      select 1 from multiplayer_games where game_pin = v_pin and status <> 'finished'
    );
  end loop;

  insert into multiplayer_games (quiz_id, host_id, game_pin, status, current_question)
  values (p_quiz_id, auth.uid(), v_pin, 'lobby', 0)
  returning id into v_game_id;

  return v_game_id;
end;
$$;

create or replace function join_multiplayer_game(p_pin text, p_player_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game_id uuid;
begin
  select id into v_game_id from multiplayer_games where game_pin = p_pin and status = 'lobby';
  if v_game_id is null then
    raise exception 'Game not found or already started';
  end if;

  insert into game_players (game_id, user_id, player_name, score)
  values (v_game_id, auth.uid(), p_player_name, 0)
  on conflict (game_id, user_id) do update set player_name = excluded.player_name;

  return v_game_id;
end;
$$;

create or replace function start_multiplayer_game(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from multiplayer_games where id = p_game_id and host_id = auth.uid()) then
    raise exception 'not authorized';
  end if;

  update multiplayer_games
     set status = 'active', current_question = 0, question_started_at = now()
   where id = p_game_id;
end;
$$;

create or replace function advance_multiplayer_game(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quiz_id uuid;
  v_current integer;
  v_total integer;
begin
  select quiz_id, current_question into v_quiz_id, v_current
    from multiplayer_games where id = p_game_id and host_id = auth.uid();

  if v_quiz_id is null then
    raise exception 'not authorized';
  end if;

  select count(*) into v_total from questions where quiz_id = v_quiz_id;

  if v_current + 1 >= v_total then
    update multiplayer_games set status = 'finished' where id = p_game_id;
  else
    update multiplayer_games
       set current_question = v_current + 1, question_started_at = now()
     where id = p_game_id;
  end if;
end;
$$;

create or replace function submit_multiplayer_answer(
  p_game_id uuid,
  p_question_id uuid,
  p_selected_answer text,
  p_response_time numeric
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player_id uuid;
  v_correct text;
  v_base_points integer;
  v_time_limit integer;
  v_is_correct boolean;
  v_points integer;
  v_speed_factor numeric;
begin
  select id into v_player_id from game_players where game_id = p_game_id and user_id = auth.uid();
  if v_player_id is null then
    raise exception 'you are not a player in this game';
  end if;

  if exists (select 1 from game_answers where game_id = p_game_id and player_id = v_player_id and question_id = p_question_id) then
    raise exception 'already answered';
  end if;

  select q.correct_answer, q.points, qz.time_limit
    into v_correct, v_base_points, v_time_limit
    from questions q
    join multiplayer_games mg on mg.id = p_game_id
    join quizzes qz on qz.id = mg.quiz_id
   where q.id = p_question_id;

  v_is_correct := (p_selected_answer = v_correct);
  v_speed_factor := greatest(0, least(1, (v_time_limit - p_response_time) / nullif(v_time_limit, 0)::numeric));
  v_points := case when v_is_correct then round(v_base_points * (1 + 0.5 * v_speed_factor)) else 0 end;

  insert into game_answers (game_id, player_id, question_id, selected_answer, is_correct, points, response_time)
  values (p_game_id, v_player_id, p_question_id, p_selected_answer, v_is_correct, v_points, p_response_time);

  update game_players set score = score + v_points where id = v_player_id;

  return json_build_object('is_correct', v_is_correct, 'points', v_points);
end;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table profiles enable row level security;
alter table quizzes enable row level security;
alter table questions enable row level security;
alter table quiz_attempts enable row level security;
alter table answers enable row level security;
alter table multiplayer_games enable row level security;
alter table game_players enable row level security;
alter table game_answers enable row level security;
alter table achievements enable row level security;
alter table user_achievements enable row level security;
alter table rewards enable row level security;
alter table user_rewards enable row level security;

-- profiles: any authenticated user can view profiles (needed for leaderboards,
-- quiz author names and multiplayer rosters); users may only edit their own
-- row, admins may edit or remove any.
drop policy if exists "profiles_select_authenticated" on profiles;
create policy "profiles_select_authenticated" on profiles for select to authenticated using (true);
drop policy if exists "profiles_insert_self" on profiles;
create policy "profiles_insert_self" on profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "profiles_update_self_or_admin" on profiles;
create policy "profiles_update_self_or_admin" on profiles for update to authenticated using (auth.uid() = id or is_admin());
drop policy if exists "profiles_delete_admin" on profiles;
create policy "profiles_delete_admin" on profiles for delete to authenticated using (is_admin());

-- quizzes
drop policy if exists "quizzes_select" on quizzes;
create policy "quizzes_select" on quizzes for select to authenticated
  using ((is_public and published) or creator_id = auth.uid() or is_admin());
drop policy if exists "quizzes_insert" on quizzes;
create policy "quizzes_insert" on quizzes for insert to authenticated
  with check (creator_id = auth.uid());
drop policy if exists "quizzes_update" on quizzes;
create policy "quizzes_update" on quizzes for update to authenticated
  using (creator_id = auth.uid() or is_admin());
drop policy if exists "quizzes_delete" on quizzes;
create policy "quizzes_delete" on quizzes for delete to authenticated
  using (creator_id = auth.uid() or is_admin());

-- questions
drop policy if exists "questions_select" on questions;
create policy "questions_select" on questions for select to authenticated
  using (exists (select 1 from quizzes q where q.id = quiz_id and ((q.is_public and q.published) or q.creator_id = auth.uid() or is_admin())));
drop policy if exists "questions_insert" on questions;
create policy "questions_insert" on questions for insert to authenticated
  with check (exists (select 1 from quizzes q where q.id = quiz_id and (q.creator_id = auth.uid() or is_admin())));
drop policy if exists "questions_update" on questions;
create policy "questions_update" on questions for update to authenticated
  using (exists (select 1 from quizzes q where q.id = quiz_id and (q.creator_id = auth.uid() or is_admin())));
drop policy if exists "questions_delete" on questions;
create policy "questions_delete" on questions for delete to authenticated
  using (exists (select 1 from quizzes q where q.id = quiz_id and (q.creator_id = auth.uid() or is_admin())));

-- quiz_attempts: readable platform-wide to power leaderboards; users may only
-- create attempts under their own id and can never edit/delete a saved score.
drop policy if exists "attempts_select" on quiz_attempts;
create policy "attempts_select" on quiz_attempts for select to authenticated using (true);
drop policy if exists "attempts_insert" on quiz_attempts;
create policy "attempts_insert" on quiz_attempts for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "attempts_delete_admin" on quiz_attempts;
create policy "attempts_delete_admin" on quiz_attempts for delete to authenticated using (is_admin());

-- answers
drop policy if exists "answers_select" on answers;
create policy "answers_select" on answers for select to authenticated
  using (exists (select 1 from quiz_attempts a where a.id = attempt_id and (a.user_id = auth.uid() or is_admin())));
drop policy if exists "answers_insert" on answers;
create policy "answers_insert" on answers for insert to authenticated
  with check (exists (select 1 from quiz_attempts a where a.id = attempt_id and a.user_id = auth.uid()));

-- multiplayer_games: visible to authenticated users so a PIN can be looked up;
-- direct writes restricted to the host, real score/state changes go through
-- the SECURITY DEFINER functions above.
drop policy if exists "games_select" on multiplayer_games;
create policy "games_select" on multiplayer_games for select to authenticated using (true);
drop policy if exists "games_insert" on multiplayer_games;
create policy "games_insert" on multiplayer_games for insert to authenticated with check (host_id = auth.uid());
drop policy if exists "games_update" on multiplayer_games;
create policy "games_update" on multiplayer_games for update to authenticated using (host_id = auth.uid() or is_admin());
drop policy if exists "games_delete" on multiplayer_games;
create policy "games_delete" on multiplayer_games for delete to authenticated using (host_id = auth.uid() or is_admin());

-- game_players: visible to all players in a game (lobby + live leaderboard);
-- inserts/score updates are only ever performed by the RPC functions, which
-- run as SECURITY DEFINER and therefore bypass these policies entirely — so
-- no regular client can ever write another player's score directly.
drop policy if exists "players_select" on game_players;
create policy "players_select" on game_players for select to authenticated using (true);
drop policy if exists "players_delete" on game_players;
create policy "players_delete" on game_players for delete to authenticated
  using (is_admin() or exists (select 1 from multiplayer_games g where g.id = game_id and g.host_id = auth.uid()));

-- game_answers: readable for review/leaderboards; writes are RPC-only (no
-- insert policy for regular clients means direct inserts are rejected).
drop policy if exists "game_answers_select" on game_answers;
create policy "game_answers_select" on game_answers for select to authenticated using (true);

-- achievements / rewards: public catalog, admin-managed
drop policy if exists "achievements_select" on achievements;
create policy "achievements_select" on achievements for select to authenticated using (true);
drop policy if exists "achievements_admin_write" on achievements;
create policy "achievements_admin_write" on achievements for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "user_achievements_select" on user_achievements;
create policy "user_achievements_select" on user_achievements for select to authenticated using (user_id = auth.uid() or is_admin());

drop policy if exists "rewards_select" on rewards;
create policy "rewards_select" on rewards for select to authenticated using (true);
drop policy if exists "rewards_admin_write" on rewards;
create policy "rewards_admin_write" on rewards for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "user_rewards_select" on user_rewards;
create policy "user_rewards_select" on user_rewards for select to authenticated using (user_id = auth.uid() or is_admin());

-- ============================================================================
-- REALTIME
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'multiplayer_games'
  ) then
    alter publication supabase_realtime add table multiplayer_games;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'game_players'
  ) then
    alter publication supabase_realtime add table game_players;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'game_answers'
  ) then
    alter publication supabase_realtime add table game_answers;
  end if;
end $$;
