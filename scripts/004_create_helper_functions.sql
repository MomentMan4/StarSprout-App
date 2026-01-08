-- Helper functions for StarSprout

-- ============================================================================
-- Function: Award badge to user
-- ============================================================================

CREATE OR REPLACE FUNCTION public.award_badge_to_user(
  p_user_id UUID,
  p_badge_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_badge_id UUID;
  v_household_id UUID;
BEGIN
  -- Get badge ID
  SELECT id INTO v_badge_id
  FROM public.starsprout_badges
  WHERE badge_key = p_badge_key;
  
  IF v_badge_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user's household
  SELECT household_id INTO v_household_id
  FROM public.starsprout_users
  WHERE id = p_user_id;
  
  -- Insert badge (ignore if already exists)
  INSERT INTO public.starsprout_user_badges (household_id, user_id, badge_id)
  VALUES (v_household_id, p_user_id, v_badge_id)
  ON CONFLICT (user_id, badge_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- ============================================================================
-- Function: Update user streak
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_user_streak(
  p_user_id UUID,
  p_completion_date DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_household_id UUID;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_last_date DATE;
  v_new_streak INTEGER;
BEGIN
  -- Get user's household
  SELECT household_id INTO v_household_id
  FROM public.starsprout_users
  WHERE id = p_user_id;
  
  -- Get current streak record
  SELECT current_streak, longest_streak, last_completion_date
  INTO v_current_streak, v_longest_streak, v_last_date
  FROM public.starsprout_streaks
  WHERE user_id = p_user_id;
  
  -- Initialize if no record
  IF v_current_streak IS NULL THEN
    INSERT INTO public.starsprout_streaks (household_id, user_id, current_streak, longest_streak, last_completion_date)
    VALUES (v_household_id, p_user_id, 1, 1, p_completion_date);
    RETURN;
  END IF;
  
  -- Calculate new streak
  IF v_last_date = p_completion_date THEN
    -- Same day, no change
    RETURN;
  ELSIF v_last_date = p_completion_date - INTERVAL '1 day' THEN
    -- Consecutive day, increment
    v_new_streak := v_current_streak + 1;
  ELSE
    -- Streak broken, reset
    v_new_streak := 1;
  END IF;
  
  -- Update streak
  UPDATE public.starsprout_streaks
  SET 
    current_streak = v_new_streak,
    longest_streak = GREATEST(longest_streak, v_new_streak),
    last_completion_date = p_completion_date,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- ============================================================================
-- Function: Update user points
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_user_points(
  p_user_id UUID,
  p_points_delta INTEGER,
  p_operation TEXT -- 'earn' or 'spend'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_household_id UUID;
BEGIN
  -- Get user's household
  SELECT household_id INTO v_household_id
  FROM public.starsprout_users
  WHERE id = p_user_id;
  
  -- Insert or update points
  INSERT INTO public.starsprout_user_points (household_id, user_id, total_points, available_points, spent_points, weekly_points)
  VALUES (
    v_household_id,
    p_user_id,
    CASE WHEN p_operation = 'earn' THEN p_points_delta ELSE 0 END,
    CASE WHEN p_operation = 'earn' THEN p_points_delta ELSE -p_points_delta END,
    CASE WHEN p_operation = 'spend' THEN p_points_delta ELSE 0 END,
    CASE WHEN p_operation = 'earn' THEN p_points_delta ELSE 0 END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = CASE 
      WHEN p_operation = 'earn' THEN starsprout_user_points.total_points + p_points_delta
      ELSE starsprout_user_points.total_points
    END,
    available_points = CASE
      WHEN p_operation = 'earn' THEN starsprout_user_points.available_points + p_points_delta
      ELSE starsprout_user_points.available_points - p_points_delta
    END,
    spent_points = CASE
      WHEN p_operation = 'spend' THEN starsprout_user_points.spent_points + p_points_delta
      ELSE starsprout_user_points.spent_points
    END,
    weekly_points = CASE
      WHEN p_operation = 'earn' THEN starsprout_user_points.weekly_points + p_points_delta
      ELSE starsprout_user_points.weekly_points
    END,
    updated_at = NOW();
END;
$$;

-- ============================================================================
-- Function: Log activity event
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_activity_event(
  p_household_id UUID,
  p_user_id UUID,
  p_event_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.starsprout_activity_events (
    household_id,
    user_id,
    event_type,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    p_household_id,
    p_user_id,
    p_event_type,
    p_entity_type,
    p_entity_id,
    p_metadata
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- ============================================================================
-- Function: Generate invite code
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_invite_code(
  p_child_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 6-character alphanumeric code
    v_code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM public.starsprout_invite_codes WHERE code = v_code) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  -- Insert code
  INSERT INTO public.starsprout_invite_codes (child_id, code, expires_at)
  VALUES (p_child_id, v_code, NOW() + INTERVAL '30 days')
  ON CONFLICT (child_id) DO UPDATE SET
    code = v_code,
    expires_at = NOW() + INTERVAL '30 days';
  
  RETURN v_code;
END;
$$;
