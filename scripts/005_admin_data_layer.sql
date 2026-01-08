-- Admin Data Layer Migration
-- Adds admin_audit_logs, enhanced feature_flags, and status fields

-- ============================================================================
-- ADMIN AUDIT LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.starsprout_admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_admin_user_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'UPDATE_USER', 'DISABLE_USER', 'UPDATE_TEMPLATE', 'RUN_JOB', etc.
  entity_type TEXT NOT NULL, -- 'household', 'user', 'quest_template', 'badge', 'feature_flag'
  entity_id TEXT NOT NULL,
  before_json JSONB,
  after_json JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.starsprout_admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Added IF NOT EXISTS to all index creation statements for idempotency
CREATE INDEX IF NOT EXISTS idx_admin_audit_actor ON public.starsprout_admin_audit_logs(actor_admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_entity ON public.starsprout_admin_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON public.starsprout_admin_audit_logs(created_at DESC);

-- RLS: Only admins can read audit logs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'starsprout_admin_audit_logs' 
    AND policyname = 'Admins can read audit logs'
  ) THEN
    CREATE POLICY "Admins can read audit logs" ON public.starsprout_admin_audit_logs
      FOR SELECT
      USING (true); -- Will be enforced at application layer via requireAdmin()
  END IF;
END $$;

-- ============================================================================
-- ENHANCED FEATURE FLAGS
-- ============================================================================

-- Drop the existing basic feature flags table and recreate with enhanced structure
DROP TABLE IF EXISTS public.starsprout_feature_flags CASCADE;

CREATE TABLE IF NOT EXISTS public.starsprout_feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scope_type TEXT NOT NULL CHECK (scope_type IN ('global', 'household', 'user')),
  scope_id TEXT, -- UUID for household/user, NULL for global
  key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  value_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(scope_type, scope_id, key)
);

ALTER TABLE public.starsprout_feature_flags ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON public.starsprout_feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_scope ON public.starsprout_feature_flags(scope_type, scope_id);

-- RLS: Admins can manage, users can read their own flags
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'starsprout_feature_flags' 
    AND policyname = 'Users can read their own flags'
  ) THEN
    CREATE POLICY "Users can read their own flags" ON public.starsprout_feature_flags
      FOR SELECT
      USING (
        scope_type = 'global' OR
        (scope_type = 'user' AND scope_id = auth.uid()::text) OR
        (scope_type = 'household' AND scope_id IN (
          SELECT household_id::text FROM public.starsprout_users WHERE id = auth.uid()
        ))
      );
  END IF;
END $$;

-- ============================================================================
-- ADD STATUS FIELDS
-- ============================================================================

-- Add status to users table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'starsprout_users' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.starsprout_users 
    ADD COLUMN status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'disabled'));
  END IF;
END $$;

-- Add status to households table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'starsprout_households' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.starsprout_households 
    ADD COLUMN status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'flagged', 'disabled'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_status ON public.starsprout_users(status);
CREATE INDEX IF NOT EXISTS idx_households_status ON public.starsprout_households(status);

-- ============================================================================
-- SEED GLOBAL FEATURE FLAGS
-- ============================================================================

INSERT INTO public.starsprout_feature_flags (scope_type, scope_id, key, enabled, value_json)
VALUES
  ('global', NULL, 'ai_motivation_messages', true, '{"max_per_day": 3}'::jsonb),
  ('global', NULL, 'ai_reflection_prompts', true, '{"max_per_day": 5}'::jsonb),
  ('global', NULL, 'ai_weekly_briefs', true, '{"send_day": "sunday", "send_hour": 19}'::jsonb),
  ('global', NULL, 'social_friends', true, '{"max_friends": 50}'::jsonb),
  ('global', NULL, 'email_notifications', true, NULL)
ON CONFLICT (scope_type, scope_id, key) DO NOTHING;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get effective feature flag (checks user → household → global)
CREATE OR REPLACE FUNCTION get_effective_flag(
  p_user_id TEXT,
  p_flag_key TEXT
)
RETURNS TABLE (
  enabled BOOLEAN,
  value_json JSONB
) AS $$
DECLARE
  v_household_id TEXT;
BEGIN
  -- Get user's household
  SELECT household_id::text INTO v_household_id
  FROM public.starsprout_users
  WHERE id::text = p_user_id;

  -- Check user-specific flag
  RETURN QUERY
  SELECT f.enabled, f.value_json
  FROM public.starsprout_feature_flags f
  WHERE f.scope_type = 'user' 
    AND f.scope_id = p_user_id
    AND f.key = p_flag_key
  LIMIT 1;

  -- If found, return
  IF FOUND THEN
    RETURN;
  END IF;

  -- Check household flag
  RETURN QUERY
  SELECT f.enabled, f.value_json
  FROM public.starsprout_feature_flags f
  WHERE f.scope_type = 'household' 
    AND f.scope_id = v_household_id
    AND f.key = p_flag_key
  LIMIT 1;

  -- If found, return
  IF FOUND THEN
    RETURN;
  END IF;

  -- Check global flag
  RETURN QUERY
  SELECT f.enabled, f.value_json
  FROM public.starsprout_feature_flags f
  WHERE f.scope_type = 'global'
    AND f.scope_id IS NULL
    AND f.key = p_flag_key
  LIMIT 1;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
