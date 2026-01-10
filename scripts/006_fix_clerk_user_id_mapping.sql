-- Migration to fix Clerk user ID vs UUID mismatch
-- This migration updates the schema to properly handle Clerk string IDs

-- ============================================================================
-- Step 1: Drop the foreign key constraint from starsprout_users.id
-- ============================================================================

ALTER TABLE public.starsprout_users DROP CONSTRAINT IF EXISTS starsprout_users_id_fkey;

-- ============================================================================
-- Step 2: Modify starsprout_users to use internal UUID + Clerk ID mapping
-- ============================================================================

-- Change id column to be auto-generated UUID (internal identifier)
ALTER TABLE public.starsprout_users 
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Add clerk_user_id column for external auth identifier
ALTER TABLE public.starsprout_users 
  ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;

-- Backfill clerk_user_id from existing id values if they look like Clerk IDs
-- (This is safe because new installs won't have data yet)
UPDATE public.starsprout_users 
SET clerk_user_id = id::text 
WHERE clerk_user_id IS NULL AND id::text LIKE 'user_%';

-- For rows that were actual UUIDs, we can't recover the Clerk ID
-- Those rows represent test/invalid data and can be safely ignored or deleted
-- In production, this migration should run before any real users are created

-- Make clerk_user_id NOT NULL after backfill
ALTER TABLE public.starsprout_users 
  ALTER COLUMN clerk_user_id SET NOT NULL;

-- Add index for fast lookups by Clerk ID
CREATE INDEX IF NOT EXISTS idx_starsprout_users_clerk_id ON public.starsprout_users(clerk_user_id);

-- ============================================================================
-- Step 3: Add status column if it doesn't exist
-- ============================================================================

ALTER TABLE public.starsprout_users 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disabled'));

-- ============================================================================
-- Step 4: Add owner tracking to households
-- ============================================================================

-- Add owner_user_id to track household owner (internal UUID FK)
ALTER TABLE public.starsprout_households 
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES public.starsprout_users(id) ON DELETE SET NULL;

-- Add owner_clerk_user_id for easier queries (denormalized)
ALTER TABLE public.starsprout_households 
  ADD COLUMN IF NOT EXISTS owner_clerk_user_id TEXT;

-- Add status column to households
ALTER TABLE public.starsprout_households 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'flagged', 'disabled'));

-- Create index for household owner lookups
CREATE INDEX IF NOT EXISTS idx_starsprout_households_owner ON public.starsprout_households(owner_clerk_user_id);

-- ============================================================================
-- Step 5: Add helper function to get or create user by Clerk ID
-- ============================================================================

CREATE OR REPLACE FUNCTION public.upsert_starsprout_user(
  p_clerk_user_id TEXT,
  p_household_id UUID,
  p_role TEXT,
  p_nickname TEXT,
  p_avatar_url TEXT DEFAULT NULL,
  p_age_band TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Try to find existing user by Clerk ID
  SELECT id INTO v_user_id
  FROM public.starsprout_users
  WHERE clerk_user_id = p_clerk_user_id;

  -- If found, update and return
  IF v_user_id IS NOT NULL THEN
    UPDATE public.starsprout_users
    SET 
      household_id = p_household_id,
      role = p_role,
      nickname = p_nickname,
      avatar_url = COALESCE(p_avatar_url, avatar_url),
      age_band = COALESCE(p_age_band, age_band),
      updated_at = NOW()
    WHERE id = v_user_id;
    
    RETURN v_user_id;
  END IF;

  -- Otherwise, insert new user
  INSERT INTO public.starsprout_users (
    clerk_user_id,
    household_id,
    role,
    nickname,
    avatar_url,
    age_band,
    status
  ) VALUES (
    p_clerk_user_id,
    p_household_id,
    p_role,
    p_nickname,
    p_avatar_url,
    p_age_band,
    'active'
  ) RETURNING id INTO v_user_id;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Step 6: Add helper function for idempotent household creation
-- ============================================================================

CREATE OR REPLACE FUNCTION public.upsert_household_for_parent(
  p_clerk_user_id TEXT,
  p_household_name TEXT,
  p_parent_nickname TEXT,
  p_parent_avatar_url TEXT DEFAULT NULL
) RETURNS TABLE(household_id UUID, user_id UUID, is_new BOOLEAN) AS $$
DECLARE
  v_household_id UUID;
  v_user_id UUID;
  v_is_new BOOLEAN := FALSE;
BEGIN
  -- Check if household already exists for this parent
  SELECT h.id, u.id 
  INTO v_household_id, v_user_id
  FROM public.starsprout_households h
  INNER JOIN public.starsprout_users u ON u.household_id = h.id
  WHERE u.clerk_user_id = p_clerk_user_id
  AND u.role = 'parent'
  LIMIT 1;

  -- If found, return existing
  IF v_household_id IS NOT NULL THEN
    RETURN QUERY SELECT v_household_id, v_user_id, FALSE;
    RETURN;
  END IF;

  -- Otherwise, create new household
  INSERT INTO public.starsprout_households (name, status)
  VALUES (p_household_name, 'active')
  RETURNING id INTO v_household_id;

  -- Create parent user record
  v_user_id := public.upsert_starsprout_user(
    p_clerk_user_id,
    v_household_id,
    'parent',
    p_parent_nickname,
    p_parent_avatar_url,
    NULL
  );

  -- Update household owner
  UPDATE public.starsprout_households
  SET 
    owner_user_id = v_user_id,
    owner_clerk_user_id = p_clerk_user_id
  WHERE id = v_household_id;

  v_is_new := TRUE;

  RETURN QUERY SELECT v_household_id, v_user_id, v_is_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.upsert_starsprout_user TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.upsert_household_for_parent TO authenticated, service_role;
