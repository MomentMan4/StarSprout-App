-- StarSprout MVP Database Schema
-- Version 1.0
-- Production-ready with RLS

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- HOUSEHOLDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.starsprout_households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.starsprout_households ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS (Parents and Children)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.starsprout_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.starsprout_households(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  age_band TEXT CHECK (age_band IN ('early_child', 'mid_child', 'pre_teen', 'teen')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.starsprout_users ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_starsprout_users_household ON public.starsprout_users(household_id);
CREATE INDEX idx_starsprout_users_role ON public.starsprout_users(role);

-- ============================================================================
-- CONSENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.starsprout_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.starsprout_households(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.starsprout_users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.starsprout_users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('coppa', 'ai_features', 'social_features')),
  granted BOOLEAN DEFAULT FALSE,
  granted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.starsprout_consents ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_starsprout_consents_household ON public.starsprout_consents(household_id);
CREATE INDEX idx_starsprout_consents_child ON public.starsprout_consents(child_id);

-- ============================================================================
-- QUEST TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.starsprout_quest_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES public.starsprout_households(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.starsprout_users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('chores', 'homework', 'hygiene', 'exercise', 'creativity', 'kindness', 'other')),
  suggested_points INTEGER DEFAULT 10,
  icon_emoji TEXT,
  is_system_template BOOLEAN DEFAULT FALSE,
  age_band_min TEXT CHECK (age_band_min IN ('early_child', 'mid_child', 'pre_teen', 'teen')),
  age_band_max TEXT CHECK (age_band_max IN ('early_child', 'mid_child', 'pre_teen', 'teen')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.starsprout_quest_templates ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_starsprout_quest_templates_household ON public.starsprout_quest_templates(household_id);
CREATE INDEX idx_starsprout_quest_templates_system ON public.starsprout_quest_templates(is_system_template);

-- ============================================================================
-- TASKS (Quest Instances)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.starsprout_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.starsprout_households(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.starsprout_quest_templates(id) ON DELETE SET NULL,
  assigned_to UUID NOT NULL REFERENCES public.starsprout_users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.starsprout_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'expired')),
  due_date TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.starsprout_users(id) ON DELETE SET NULL,
  reflection_text TEXT,
  streak_eligible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.starsprout_tasks ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_starsprout_tasks_household ON public.starsprout_tasks(household_id);
CREATE INDEX idx_starsprout_tasks_assigned_to ON public.starsprout_tasks(assigned_to);
CREATE INDEX idx_starsprout_tasks_status ON public.starsprout_tasks(status);
CREATE INDEX idx_starsprout_tasks_due_date ON public.starsprout_tasks(due_date);

-- ============================================================================
-- REWARDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.starsprout_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.starsprout_households(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.starsprout_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  icon_emoji TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.starsprout_rewards ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_starsprout_rewards_household ON public.starsprout_rewards(household_id);
CREATE INDEX idx_starsprout_rewards_active ON public.starsprout_rewards(is_active);

-- ============================================================================
-- REWARD REDEMPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.starsprout_reward_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.starsprout_households(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.starsprout_rewards(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.starsprout_users(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'fulfilled')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.starsprout_users(id) ON DELETE SET NULL,
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.starsprout_reward_redemptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_starsprout_reward_redemptions_household ON public.starsprout_reward_redemptions(household_id);
CREATE INDEX idx_starsprout_reward_redemptions_child ON public.starsprout_reward_redemptions(child_id);
CREATE INDEX idx_starsprout_reward_redemptions_status ON public.starsprout_reward_redemptions(status);

-- ============================================================================
-- BADGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.starsprout_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('first_quest', 'streak', 'milestone', 'special')),
  award_criteria JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.starsprout_badges ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER BADGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.starsprout_user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.starsprout_households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.starsprout_users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.starsprout_badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.starsprout_user_badges ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_starsprout_user_badges_household ON public.starsprout_user_badges(household_id);
CREATE INDEX idx_starsprout_user_badges_user ON public.starsprout_user_badges(user_id);

-- ============================================================================
-- STREAKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.starsprout_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.starsprout_households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.starsprout_users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completion_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.starsprout_streaks ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_starsprout_streaks_household ON public.starsprout_streaks(household_id);
CREATE INDEX idx_starsprout_streaks_user ON public.starsprout_streaks(user_id);

-- ============================================================================
-- FRIENDSHIPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.starsprout_friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.starsprout_users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.starsprout_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.starsprout_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, friend_id),
  CHECK (child_id <> friend_id)
);

ALTER TABLE public.starsprout_friendships ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_starsprout_friendships_child ON public.starsprout_friendships(child_id);
CREATE INDEX idx_starsprout_friendships_friend ON public.starsprout_friendships(friend_id);
CREATE INDEX idx_starsprout_friendships_status ON public.starsprout_friendships(status);

-- ============================================================================
-- LEADERBOARD SNAPSHOTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.starsprout_leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.starsprout_users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  quests_completed INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.starsprout_leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_starsprout_leaderboard_user ON public.starsprout_leaderboard_snapshots(user_id);
CREATE INDEX idx_starsprout_leaderboard_week ON public.starsprout_leaderboard_snapshots(week_start, week_end);

-- ============================================================================
-- ACTIVITY EVENTS (Audit Log)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.starsprout_activity_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.starsprout_households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.starsprout_users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('task_assigned', 'task_submitted', 'task_approved', 'task_rejected', 'reward_requested', 'reward_approved', 'reward_fulfilled', 'badge_awarded', 'friend_requested', 'friend_approved')),
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.starsprout_activity_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_starsprout_activity_household ON public.starsprout_activity_events(household_id);
CREATE INDEX idx_starsprout_activity_user ON public.starsprout_activity_events(user_id);
CREATE INDEX idx_starsprout_activity_type ON public.starsprout_activity_events(event_type);
CREATE INDEX idx_starsprout_activity_created ON public.starsprout_activity_events(created_at);

-- ============================================================================
-- WEEKLY SUMMARIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.starsprout_weekly_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.starsprout_households(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  summary_text TEXT,
  strengths JSONB,
  opportunities JSONB,
  suggested_praise TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(household_id, week_start)
);

ALTER TABLE public.starsprout_weekly_summaries ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_starsprout_weekly_summaries_household ON public.starsprout_weekly_summaries(household_id);
CREATE INDEX idx_starsprout_weekly_summaries_week ON public.starsprout_weekly_summaries(week_start);

-- ============================================================================
-- NOTIFICATION PREFERENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.starsprout_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.starsprout_users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT TRUE,
  weekly_summary_email BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.starsprout_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_starsprout_notification_prefs_user ON public.starsprout_notification_preferences(user_id);

-- ============================================================================
-- FEATURE FLAGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.starsprout_feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_key TEXT UNIQUE NOT NULL,
  flag_name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT FALSE,
  household_id UUID REFERENCES public.starsprout_households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.starsprout_users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.starsprout_feature_flags ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_starsprout_feature_flags_key ON public.starsprout_feature_flags(flag_key);
CREATE INDEX idx_starsprout_feature_flags_household ON public.starsprout_feature_flags(household_id);

-- ============================================================================
-- USER POINTS (Aggregate table for performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.starsprout_user_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.starsprout_households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.starsprout_users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  available_points INTEGER DEFAULT 0,
  spent_points INTEGER DEFAULT 0,
  weekly_points INTEGER DEFAULT 0,
  last_reset_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.starsprout_user_points ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_starsprout_user_points_household ON public.starsprout_user_points(household_id);
CREATE INDEX idx_starsprout_user_points_user ON public.starsprout_user_points(user_id);

-- ============================================================================
-- INVITE CODES (for friend connections)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.starsprout_invite_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.starsprout_users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.starsprout_invite_codes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_starsprout_invite_codes_child ON public.starsprout_invite_codes(child_id);
CREATE INDEX idx_starsprout_invite_codes_code ON public.starsprout_invite_codes(code);
