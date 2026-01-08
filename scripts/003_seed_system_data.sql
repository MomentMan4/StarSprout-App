-- Seed system badges and templates

-- ============================================================================
-- SYSTEM BADGES
-- ============================================================================

INSERT INTO public.starsprout_badges (badge_key, title, description, category, award_criteria) VALUES
  ('first_quest', 'First Quest Complete', 'Completed your very first quest!', 'first_quest', '{"quests_completed": 1}'::jsonb),
  ('streak_3', '3-Day Streak', 'Completed quests for 3 days in a row!', 'streak', '{"streak_days": 3}'::jsonb),
  ('streak_7', 'Week Warrior', 'Completed quests for 7 days in a row!', 'streak', '{"streak_days": 7}'::jsonb),
  ('streak_14', 'Two-Week Champion', 'Completed quests for 14 days in a row!', 'streak', '{"streak_days": 14}'::jsonb),
  ('streak_30', 'Month Master', 'Completed quests for 30 days in a row!', 'streak', '{"streak_days": 30}'::jsonb),
  ('milestone_10', 'Quest Explorer', 'Completed 10 quests!', 'milestone', '{"quests_completed": 10}'::jsonb),
  ('milestone_25', 'Quest Adventurer', 'Completed 25 quests!', 'milestone', '{"quests_completed": 25}'::jsonb),
  ('milestone_50', 'Quest Hero', 'Completed 50 quests!', 'milestone', '{"quests_completed": 50}'::jsonb),
  ('milestone_100', 'Quest Legend', 'Completed 100 quests!', 'milestone', '{"quests_completed": 100}'::jsonb),
  ('category_chores_10', 'Chore Champion', 'Completed 10 chore quests!', 'special', '{"category": "chores", "count": 10}'::jsonb),
  ('category_homework_10', 'Homework Hero', 'Completed 10 homework quests!', 'special', '{"category": "homework", "count": 10}'::jsonb),
  ('category_kindness_10', 'Kindness Star', 'Completed 10 kindness quests!', 'special', '{"category": "kindness", "count": 10}'::jsonb)
ON CONFLICT (badge_key) DO NOTHING;

-- ============================================================================
-- SYSTEM QUEST TEMPLATES
-- ============================================================================

INSERT INTO public.starsprout_quest_templates (household_id, created_by, title, description, category, suggested_points, icon_emoji, is_system_template, age_band_min, age_band_max) VALUES
  -- Chores
  (NULL, NULL, 'Make Your Bed', 'Make your bed nice and neat', 'chores', 5, '🛏️', true, 'early_child', 'teen'),
  (NULL, NULL, 'Clean Your Room', 'Put away toys and organize your space', 'chores', 10, '🧹', true, 'early_child', 'teen'),
  (NULL, NULL, 'Help with Dishes', 'Help wash or dry the dishes', 'chores', 10, '🍽️', true, 'mid_child', 'teen'),
  (NULL, NULL, 'Take Out Trash', 'Take the trash to the bin', 'chores', 8, '🗑️', true, 'mid_child', 'teen'),
  (NULL, NULL, 'Feed the Pet', 'Feed your pet and give them fresh water', 'chores', 5, '🐕', true, 'early_child', 'teen'),
  (NULL, NULL, 'Water Plants', 'Water the indoor or outdoor plants', 'chores', 5, '🌱', true, 'mid_child', 'teen'),
  (NULL, NULL, 'Vacuum a Room', 'Vacuum the living room or bedroom', 'chores', 12, '🧽', true, 'pre_teen', 'teen'),
  
  -- Homework
  (NULL, NULL, 'Complete Homework', 'Finish all your homework assignments', 'homework', 15, '📚', true, 'early_child', 'teen'),
  (NULL, NULL, 'Read for 20 Minutes', 'Read a book for 20 minutes', 'homework', 10, '📖', true, 'early_child', 'teen'),
  (NULL, NULL, 'Practice Math', 'Complete your math practice exercises', 'homework', 12, '➕', true, 'early_child', 'teen'),
  (NULL, NULL, 'Study for Test', 'Review notes and study for your test', 'homework', 15, '📝', true, 'mid_child', 'teen'),
  
  -- Hygiene
  (NULL, NULL, 'Brush Teeth Morning', 'Brush your teeth in the morning', 'hygiene', 3, '🪥', true, 'early_child', 'teen'),
  (NULL, NULL, 'Brush Teeth Night', 'Brush your teeth before bed', 'hygiene', 3, '🌙', true, 'early_child', 'teen'),
  (NULL, NULL, 'Take a Shower', 'Take a shower and wash your hair', 'hygiene', 8, '🚿', true, 'early_child', 'teen'),
  (NULL, NULL, 'Wash Hands', 'Wash your hands with soap', 'hygiene', 2, '🧼', true, 'early_child', 'mid_child'),
  
  -- Exercise
  (NULL, NULL, 'Go Outside for 30 Minutes', 'Play outside for at least 30 minutes', 'exercise', 10, '⚽', true, 'early_child', 'teen'),
  (NULL, NULL, 'Ride Your Bike', 'Go for a bike ride', 'exercise', 12, '🚲', true, 'mid_child', 'teen'),
  (NULL, NULL, 'Play a Sport', 'Practice or play your favorite sport', 'exercise', 15, '🏀', true, 'mid_child', 'teen'),
  (NULL, NULL, 'Do Stretches', 'Complete a stretching routine', 'exercise', 8, '🧘', true, 'mid_child', 'teen'),
  
  -- Creativity
  (NULL, NULL, 'Draw or Color', 'Create some art by drawing or coloring', 'creativity', 8, '🎨', true, 'early_child', 'teen'),
  (NULL, NULL, 'Build Something', 'Build with blocks, Lego, or other materials', 'creativity', 10, '🧱', true, 'early_child', 'mid_child'),
  (NULL, NULL, 'Practice Music', 'Practice your musical instrument', 'creativity', 12, '🎵', true, 'mid_child', 'teen'),
  (NULL, NULL, 'Write a Story', 'Write a creative story or poem', 'creativity', 15, '✍️', true, 'mid_child', 'teen'),
  
  -- Kindness
  (NULL, NULL, 'Help a Family Member', 'Do something kind for someone in your family', 'kindness', 10, '❤️', true, 'early_child', 'teen'),
  (NULL, NULL, 'Say Something Nice', 'Give someone a genuine compliment', 'kindness', 5, '💬', true, 'early_child', 'teen'),
  (NULL, NULL, 'Share with Someone', 'Share a toy, snack, or your time with someone', 'kindness', 8, '🤝', true, 'early_child', 'teen'),
  (NULL, NULL, 'Help a Neighbor', 'Do something helpful for a neighbor', 'kindness', 15, '🏘️', true, 'mid_child', 'teen')
ON CONFLICT DO NOTHING;
