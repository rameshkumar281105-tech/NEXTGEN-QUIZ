-- ============================================================================
-- NextGen Quiz — seed data
-- Run this AFTER schema.sql. Achievements/rewards are needed for the app's
-- gamification features to work; sample quizzes are optional but recommended
-- so /quizzes isn't empty on first run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Achievements
-- ----------------------------------------------------------------------------
insert into achievements (code, name, description, icon, requirement) values
  ('first_quiz',       'First Quiz',        'Complete your very first quiz.',                         '🎉', 'Complete 1 quiz'),
  ('perfect_score',    'Perfect Score',      'Score 100% on any quiz.',                                 '💯', 'Score 100% on a quiz'),
  ('quiz_champion',    'Quiz Champion',      'Complete 10 quizzes.',                                    '🏆', 'Complete 10 quizzes'),
  ('speed_master',     'Speed Master',       'Average under 6s per answer on a strong score.',          '⚡', 'Fast answers, 80%+ score'),
  ('streak_5',         '5 Quiz Streak',      'Keep a 5-quiz streak alive.',                             '🔥', 'Reach a 5-quiz streak'),
  ('streak_10',        '10 Quiz Streak',     'Keep a 10-quiz streak alive.',                            '🔥', 'Reach a 10-quiz streak'),
  ('science_master',   'Science Master',     'Score 70%+ on 5 Science quizzes.',                        '🔬', '5 Science quizzes at 70%+'),
  ('technology_master','Technology Master',  'Score 70%+ on 5 Technology quizzes.',                     '💻', '5 Technology quizzes at 70%+'),
  ('history_master',   'History Master',     'Score 70%+ on 5 History quizzes.',                        '📜', '5 History quizzes at 70%+'),
  ('sports_master',    'Sports Master',      'Score 70%+ on 5 Sports quizzes.',                         '🏅', '5 Sports quizzes at 70%+'),
  ('gk_master',        'General Knowledge Master', 'Score 70%+ on 5 General Knowledge quizzes.',        '🧠', '5 GK quizzes at 70%+')
on conflict (code) do nothing;

-- ----------------------------------------------------------------------------
-- Reward tiers
-- ----------------------------------------------------------------------------
insert into rewards (name, description, xp_required) values
  ('Bronze Badge',   'Awarded for reaching 100 XP.',   100),
  ('Silver Badge',   'Awarded for reaching 500 XP.',   500),
  ('Gold Badge',     'Awarded for reaching 1500 XP.',  1500),
  ('Platinum Badge', 'Awarded for reaching 3000 XP.',  3000),
  ('Diamond Badge',  'Awarded for reaching 6000 XP.',  6000)
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- Sample quizzes
-- NOTE: quizzes.creator_id references a real profiles row (which in turn
-- requires a real auth.users row). Sign up for at least one account first,
-- then either:
--   a) replace :creator_id below with that user's UUID and run this block, or
--   b) run the block from the SQL editor using the UUID of any existing user:
--        select id, email from profiles;
-- ----------------------------------------------------------------------------

do $$
declare
  v_creator uuid;
  v_quiz_id uuid;
begin
  -- Uses the first profile found as the sample content author.
  -- Re-run schema.sql + sign up at least one account before seeding.
  select id into v_creator from profiles order by created_at asc limit 1;

  if v_creator is null then
    raise notice 'No profiles found yet — sign up a user first, then re-run seed.sql to get sample quizzes.';
    return;
  end if;

  -- Quiz 1: General Knowledge
  insert into quizzes (creator_id, title, description, category, difficulty, time_limit, is_public, published)
  values (v_creator, 'World Capitals & Facts', 'A quick spin through capitals, geography and general trivia.', 'General Knowledge', 'easy', 25, true, true)
  returning id into v_quiz_id;

  insert into questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, points, question_order) values
  (v_quiz_id, 'What is the capital of Japan?', 'Seoul', 'Tokyo', 'Beijing', 'Bangkok', 'b', 'Tokyo has been the capital of Japan since 1868.', 10, 0),
  (v_quiz_id, 'Which is the largest ocean on Earth?', 'Atlantic', 'Indian', 'Arctic', 'Pacific', 'd', 'The Pacific Ocean covers about a third of the Earth''s surface.', 10, 1),
  (v_quiz_id, 'How many continents are there?', '5', '6', '7', '8', 'c', 'The commonly taught model has seven continents.', 10, 2),
  (v_quiz_id, 'What is the smallest country in the world?', 'Monaco', 'Vatican City', 'San Marino', 'Liechtenstein', 'b', 'Vatican City is about 0.44 square kilometers.', 10, 3),
  (v_quiz_id, 'Which river is the longest in the world?', 'Amazon', 'Yangtze', 'Nile', 'Mississippi', 'c', 'The Nile is generally considered the longest river.', 10, 4);

  -- Quiz 2: Science
  insert into quizzes (creator_id, title, description, category, difficulty, time_limit, is_public, published)
  values (v_creator, 'Everyday Science', 'Test your grasp of core scientific concepts.', 'Science', 'medium', 30, true, true)
  returning id into v_quiz_id;

  insert into questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, points, question_order) values
  (v_quiz_id, 'What gas do plants absorb from the atmosphere for photosynthesis?', 'Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen', 'c', 'Plants absorb CO2 and release oxygen during photosynthesis.', 10, 0),
  (v_quiz_id, 'What is the chemical symbol for gold?', 'Go', 'Gd', 'Au', 'Ag', 'c', 'Au comes from the Latin "aurum".', 10, 1),
  (v_quiz_id, 'How many bones are in the adult human body?', '186', '206', '226', '246', 'b', 'Adults typically have 206 bones.', 10, 2),
  (v_quiz_id, 'What planet is known as the Red Planet?', 'Venus', 'Jupiter', 'Mars', 'Saturn', 'c', 'Iron oxide on its surface gives Mars its reddish color.', 10, 3),
  (v_quiz_id, 'What is the powerhouse of the cell?', 'Nucleus', 'Ribosome', 'Mitochondria', 'Golgi body', 'c', 'Mitochondria generate most of the cell''s ATP.', 10, 4),
  (v_quiz_id, 'At sea level, water boils at what temperature (Celsius)?', '90°C', '100°C', '110°C', '120°C', 'b', 'Water boils at 100°C at standard atmospheric pressure.', 10, 5);

  -- Quiz 3: Technology
  insert into quizzes (creator_id, title, description, category, difficulty, time_limit, is_public, published)
  values (v_creator, 'Tech Fundamentals', 'From the web to hardware basics.', 'Technology', 'medium', 25, true, true)
  returning id into v_quiz_id;

  insert into questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, points, question_order) values
  (v_quiz_id, 'What does "HTTP" stand for?', 'HyperText Transfer Protocol', 'High Transfer Text Protocol', 'HyperText Transit Program', 'Home Tool Transfer Protocol', 'a', 'HTTP is the foundation of data communication on the web.', 10, 0),
  (v_quiz_id, 'What does "CPU" stand for?', 'Central Process Unit', 'Central Processing Unit', 'Computer Personal Unit', 'Control Processing Unit', 'b', 'The CPU is the primary component that executes instructions.', 10, 1),
  (v_quiz_id, 'Which company developed the React library?', 'Google', 'Meta (Facebook)', 'Microsoft', 'Amazon', 'b', 'React was created by Facebook, now Meta.', 10, 2),
  (v_quiz_id, 'What does "SQL" stand for?', 'Structured Query Language', 'Sequential Query Language', 'Structured Question Language', 'Simple Query Logic', 'a', 'SQL is used to manage relational databases.', 10, 3),
  (v_quiz_id, 'What year was the first iPhone released?', '2005', '2006', '2007', '2008', 'c', 'Apple released the first iPhone in 2007.', 10, 4);

  -- Quiz 4: History
  insert into quizzes (creator_id, title, description, category, difficulty, time_limit, is_public, published)
  values (v_creator, 'Milestones in History', 'Key events that shaped the modern world.', 'History', 'hard', 30, true, true)
  returning id into v_quiz_id;

  insert into questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, points, question_order) values
  (v_quiz_id, 'In what year did World War II end?', '1943', '1944', '1945', '1946', 'c', 'WWII ended in 1945 with the surrender of Japan.', 15, 0),
  (v_quiz_id, 'Who was the first President of the United States?', 'Thomas Jefferson', 'George Washington', 'John Adams', 'Benjamin Franklin', 'b', 'George Washington served from 1789 to 1797.', 15, 1),
  (v_quiz_id, 'The Great Wall of China was primarily built to defend against whom?', 'Mongol and nomadic invasions', 'Japanese forces', 'Roman legions', 'Persian armies', 'a', 'It was built over centuries to guard against northern invasions.', 15, 2),
  (v_quiz_id, 'In what year did the Berlin Wall fall?', '1987', '1989', '1991', '1993', 'b', 'The Berlin Wall fell in November 1989.', 15, 3);

  -- Quiz 5: Sports
  insert into quizzes (creator_id, title, description, category, difficulty, time_limit, is_public, published)
  values (v_creator, 'Sports Trivia Mix', 'A mixed bag of sports knowledge.', 'Sports', 'easy', 20, true, true)
  returning id into v_quiz_id;

  insert into questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, points, question_order) values
  (v_quiz_id, 'How many players are on a standard soccer team on the field?', '9', '10', '11', '12', 'c', 'Each team fields 11 players, including the goalkeeper.', 10, 0),
  (v_quiz_id, 'In which sport would you perform a "slam dunk"?', 'Volleyball', 'Basketball', 'Tennis', 'Badminton', 'b', 'Slam dunks are a signature basketball move.', 10, 1),
  (v_quiz_id, 'How often are the Summer Olympic Games held?', 'Every 2 years', 'Every 3 years', 'Every 4 years', 'Every 5 years', 'c', 'The Summer Olympics occur every four years.', 10, 2),
  (v_quiz_id, 'What sport is known as "the beautiful game"?', 'Cricket', 'Soccer', 'Rugby', 'Baseball', 'b', 'Soccer (football) is widely nicknamed this way.', 10, 3);

  -- Quiz 6: Current Affairs (evergreen, non-dated sample questions)
  insert into quizzes (creator_id, title, description, category, difficulty, time_limit, is_public, published)
  values (v_creator, 'Global Awareness Basics', 'General current-affairs style trivia — update regularly with fresh questions.', 'Current Affairs', 'medium', 25, true, true)
  returning id into v_quiz_id;

  insert into questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, points, question_order) values
  (v_quiz_id, 'Which organization is headquartered in Geneva and coordinates global health policy?', 'UNESCO', 'World Health Organization', 'UNICEF', 'World Bank', 'b', 'WHO is the UN agency responsible for international public health.', 10, 0),
  (v_quiz_id, 'The G7 is a group of major economies — how many member countries does it have?', '5', '6', '7', '9', 'c', 'The G7 comprises seven major advanced economies.', 10, 1),
  (v_quiz_id, 'Which gas is most associated with global warming?', 'Oxygen', 'Carbon dioxide', 'Nitrogen', 'Helium', 'b', 'CO2 is the primary greenhouse gas driving climate change.', 10, 2);

end $$;
