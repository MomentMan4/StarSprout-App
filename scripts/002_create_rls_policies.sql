-- StarSprout RLS Policies
-- Household isolation is the primary security model

-- ============================================================================
-- HOUSEHOLDS
-- ============================================================================

-- Parents in household can view their household
CREATE POLICY "households_select_own" ON public.starsprout_households
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.starsprout_users
      WHERE starsprout_users.id = auth.uid()
        AND starsprout_users.household_id = starsprout_households.id
        AND starsprout_users.role = 'parent'
    )
  );

-- Parents can update their own household
CREATE POLICY "households_update_own" ON public.starsprout_households
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.starsprout_users
      WHERE starsprout_users.id = auth.uid()
        AND starsprout_users.household_id = starsprout_households.id
        AND starsprout_users.role = 'parent'
    )
  );

-- Service role can insert households
CREATE POLICY "households_insert_service" ON public.starsprout_households
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- USERS
-- ============================================================================

-- Users can view users in their own household
CREATE POLICY "users_select_household" ON public.starsprout_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.starsprout_users viewer
      WHERE viewer.id = auth.uid()
        AND viewer.household_id = starsprout_users.household_id
    )
  );

-- Service role can insert users (for onboarding)
CREATE POLICY "users_insert_service" ON public.starsprout_users
  FOR INSERT
  WITH CHECK (true);

-- Parents can update users in their household
CREATE POLICY "users_update_parent" ON public.starsprout_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.starsprout_users parent
      WHERE parent.id = auth.uid()
        AND parent.household_id = starsprout_users.household_id
        AND parent.role = 'parent'
    )
  );

-- Users can update their own profile
CREATE POLICY "users_update_own" ON public.starsprout_users
  FOR UPDATE
  USING (id = auth.uid());

-- ============================================================================
-- CONSENTS
-- ============================================================================

-- Parents can view consents in their household
CREATE POLICY "consents_select_household" ON public.starsprout_consents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.starsprout_users
      WHERE starsprout_users.id = auth.uid()
        AND starsprout_users.household_id = starsprout_consents.household_id
        AND starsprout_users.role = 'parent'
    )
  );

-- Parents can insert consents
CREATE POLICY "consents_insert_parent" ON public.starsprout_consents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.starsprout_users
      WHERE starsprout_users.id = auth.uid()
        AND starsprout_users.household_id = starsprout_consents.household_id
        AND starsprout_users.role = 'parent'
    )
  );

-- ============================================================================
-- QUEST TEMPLATES
-- ============================================================================

-- Users can view system templates and templates in their household
CREATE POLICY "quest_templates_select" ON public.starsprout_quest_templates
  FOR SELECT
  USING (
    is_system_template = true OR
    EXISTS (
      SELECT 1 FROM public.starsprout_users
      WHERE starsprout_users.id = auth.uid()
        AND starsprout_users.household_id = starsprout_quest_templates.household_id
    )
  );

-- Parents can insert templates
CREATE POLICY "quest_templates_insert_parent" ON public.starsprout_quest_templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.starsprout_users
      WHERE starsprout_users.id = auth.uid()
        AND starsprout_users.household_id = starsprout_quest_templates.household_id
        AND starsprout_users.role = 'parent'
    )
  );

-- Parents can update their household templates
CREATE POLICY "quest_templates_update_parent" ON public.starsprout_quest_templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.starsprout_users
      WHERE starsprout_users.id = auth.uid()
        AND starsprout_users.household_id = starsprout_quest_templates.household_id
        AND starsprout_users.role = 'parent'
    )
  );

-- Service role can insert system templates
CREATE POLICY "quest_templates_insert_system" ON public.starsprout_quest_templates
  FOR INSERT
  WITH CHECK (is_system_template = true);

-- ============================================================================
-- TASKS
-- ============================================================================

-- Users can view tasks in their household
CREATE POLICY "tasks_select_household" ON public.starsprout_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.starsprout_users
      WHERE starsprout_users.id = auth.uid()
        AND starsprout_users.household_id = starsprout_tasks.household_id
    )
  );

-- Parents can insert tasks
CREATE POLICY "tasks_insert_parent" ON public.starsprout_tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.starsprout_users
      WHERE starsprout_users.id = auth.uid()
        AND starsprout_users.household_id = starsprout_tasks.household_id
        AND starsprout_users.role = 'parent'
    )
  );

-- Parents can update tasks in their household
CREATE POLICY "tasks_update_parent" ON public.starsprout_tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.starsprout_users
      WHERE starsprout_users.id = auth.uid()
        AND starsprout_users.household_id = starsprout_tasks.household_id
        AND starsprout_users.role = 'parent'
    )
  );

-- Children can update their own tasks (for submission)
CREATE POLICY "tasks_update_own" ON public.starsprout_tasks
  FOR UPDATE
  USING (assigned_to = auth.uid());

-- ============================================================================
-- REWARDS
-- ============================================================================

-- Users can view rewards in their household
CREATE POLICY "rewards_select_household" ON public.starsprout_rewards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.starsprout_users
      WHERE starsprout_users.id = auth.uid()
        AND starsprout_users.household_id = starsprout_rewards.household_id
    )
  );

-- Parents can insert rewards
CREATE POLICY "rewards_insert_parent" ON public.starsprout_rewards
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.starsprout_users
      WHERE starsprout_users.id = auth.uid()
        AND starsprout_users.household_id = starsprout_rewards.household_id
        AND starsprout_users.role = 'parent'
    )
  );

-- Parents can update rewards
CREATE POLICY "rewards_update_parent" ON public.starsprout_rewards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.starsprout_users
      WHERE starsprout_users.id = auth.uid()
        AND starsprout_users.household_id = starsprout_rewards.household_id
        AND starsprout_users.role = 'parent'
    )
  );

-- ============================================================================
-- REWARD REDEMPTIONS
-- ============================================================================

-- Users can view redemptions in their household
CREATE POLICY "reward_redemptions_select_household" ON public.starsprout_reward_redemptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.starsprout_users
      WHERE starsprout_users.id = auth.uid()
        AND starsprout_users.household_id = starsprout_reward_redemptions.household_id
    )
  );

-- Children can insert their own redemption requests
CREATE POLICY "reward_redemptions_insert_child" ON public.starsprout_reward_redemptions
  FOR INSERT
  WITH CHECK (child_id = auth.uid());

-- Parents can update redemptions in their household
CREATE POLICY "reward_redemptions_update_parent" ON public.starsprout_reward_redemptions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.starsprout_users
      WHERE starsprout_users.id = auth.uid()
        AND starsprout_users.household_id = starsprout_reward_redemptions.household_id
        AND starsprout_users.role = 'parent'
    )
  );

-- ============================================================================
-- BADGES
-- ============================================================================

-- Anyone can view badges (system-wide)
CREATE POLICY "badges_select_all" ON public.starsprout_badges
  FOR SELECT
  USING (true);

-- Service role can manage badges
CREATE POLICY "badges_manage_service" ON public.starsprout_badges
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- USER BADGES
-- ============================================================================

-- Users can view badges in their household
CREATE POLICY "user_badges_select_household" ON public.starsprout_user_badges
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.starsprout_users
      WHERE starsprout_users.id = auth.uid()
        AND starsprout_users.household_id = starsprout_user_badges.household_id
    )
  );

-- Service role can insert badges (awarded by system)
CREATE POLICY "user_badges_insert_service" ON public.starsprout_user_badges
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- STREAKS
-- ============================================================================

-- Users can view streaks in their household
CREATE POLICY "streaks_select_household" ON public.starsprout_streaks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.starsprout_users
      WHERE starsprout_users.id = auth.uid()
        AND starsprout_users.household_id = starsprout_streaks.household_id
    )
  );

-- Service role can manage streaks
CREATE POLICY "streaks_manage_service" ON public.starsprout_streaks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FRIENDSHIPS
-- ============================================================================

-- Children can view their own friendships
CREATE POLICY "friendships_select_own" ON public.starsprout_friendships
  FOR SELECT
  USING (child_id = auth.uid() OR friend_id = auth.uid());

-- Parents can view friendships for children in their household
CREATE POLICY "friendships_select_parent" ON public.starsprout_friendships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.starsprout_users parent
      WHERE parent.id = auth.uid()
        AND parent.role = 'parent'
        AND EXISTS (
          SELECT 1 FROM public.starsprout_users child
          WHERE child.id IN (starsprout_friendships.child_id, starsprout_friendships.friend_id)
            AND child.household_id = parent.household_id
        )
    )
  );

-- Children can request friendships
CREATE POLICY "friendships_insert_child" ON public.starsprout_friendships
  FOR INSERT
  WITH CHECK (child_id = auth.uid());

-- Parents can update friendship status
CREATE POLICY "friendships_update_parent" ON public.starsprout_friendships
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.starsprout_users parent
      WHERE parent.id = auth.uid()
        AND parent.role = 'parent'
        AND EXISTS (
          SELECT 1 FROM public.starsprout_users child
          WHERE child.id IN (starsprout_friendships.child_id, starsprout_friendships.friend_id)
            AND child.household_id = parent.household_id
        )
    )
  );

-- ============================================================================
-- LEADERBOARD SNAPSHOTS
-- ============================================================================

-- Users can view leaderboard data for their friends
CREATE POLICY "leaderboard_select_friends" ON public.starsprout_leaderboard_snapshots
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.starsprout_friendships f
      WHERE (f.child_id = auth.uid() AND f.friend_id = starsprout_leaderboard_snapshots.user_id AND f.status = 'approved')
         OR (f.friend_id = auth.uid() AND f.child_id = starsprout_leaderboard_snapshots.user_id AND f.status = 'approved')
    )
  );

-- Service role can manage leaderboard snapshots
CREATE POLICY "leaderboard_manage_service" ON public.starsprout_leaderboard_snapshots
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- ACTIVITY EVENTS
-- ============================================================================

-- Parents can view activity in their household
CREATE POLICY "activity_select_household" ON public.starsprout_activity_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.starsprout_users
      WHERE starsprout_users.id = auth.uid()
        AND starsprout_users.household_id = starsprout_activity_events.household_id
        AND starsprout_users.role = 'parent'
    )
  );

-- Service role can insert activity events
CREATE POLICY "activity_insert_service" ON public.starsprout_activity_events
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- WEEKLY SUMMARIES
-- ============================================================================

-- Parents can view summaries for their household
CREATE POLICY "weekly_summaries_select_household" ON public.starsprout_weekly_summaries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.starsprout_users
      WHERE starsprout_users.id = auth.uid()
        AND starsprout_users.household_id = starsprout_weekly_summaries.household_id
        AND starsprout_users.role = 'parent'
    )
  );

-- Service role can manage summaries
CREATE POLICY "weekly_summaries_manage_service" ON public.starsprout_weekly_summaries
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- NOTIFICATION PREFERENCES
-- ============================================================================

-- Users can view their own preferences
CREATE POLICY "notification_prefs_select_own" ON public.starsprout_notification_preferences
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "notification_prefs_update_own" ON public.starsprout_notification_preferences
  FOR UPDATE
  USING (user_id = auth.uid());

-- Service role can insert preferences
CREATE POLICY "notification_prefs_insert_service" ON public.starsprout_notification_preferences
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- FEATURE FLAGS
-- ============================================================================

-- Users can view their relevant flags
CREATE POLICY "feature_flags_select_user" ON public.starsprout_feature_flags
  FOR SELECT
  USING (
    user_id IS NULL AND household_id IS NULL OR
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.starsprout_users
      WHERE starsprout_users.id = auth.uid()
        AND starsprout_users.household_id = starsprout_feature_flags.household_id
    )
  );

-- Service role can manage flags
CREATE POLICY "feature_flags_manage_service" ON public.starsprout_feature_flags
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- USER POINTS
-- ============================================================================

-- Users can view points in their household
CREATE POLICY "user_points_select_household" ON public.starsprout_user_points
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.starsprout_users
      WHERE starsprout_users.id = auth.uid()
        AND starsprout_users.household_id = starsprout_user_points.household_id
    )
  );

-- Service role can manage points
CREATE POLICY "user_points_manage_service" ON public.starsprout_user_points
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- INVITE CODES
-- ============================================================================

-- Children can view their own codes
CREATE POLICY "invite_codes_select_own" ON public.starsprout_invite_codes
  FOR SELECT
  USING (child_id = auth.uid());

-- Parents can view codes for children in their household
CREATE POLICY "invite_codes_select_parent" ON public.starsprout_invite_codes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.starsprout_users parent
      JOIN public.starsprout_users child ON child.household_id = parent.household_id
      WHERE parent.id = auth.uid()
        AND parent.role = 'parent'
        AND child.id = starsprout_invite_codes.child_id
    )
  );

-- Service role can manage invite codes
CREATE POLICY "invite_codes_manage_service" ON public.starsprout_invite_codes
  FOR ALL
  USING (true)
  WITH CHECK (true);
