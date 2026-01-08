// Settings Repository - Manage user preferences and feature flags

import { createClient } from "@/lib/supabase/server"
import type { NotificationPreference, FeatureFlag } from "../types"

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

export async function getNotificationPreferences(userId: string): Promise<NotificationPreference | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("starsprout_notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error && error.code !== "PGRST116") {
    console.error("[v0] Error fetching notification preferences:", error)
    return null
  }

  return data
}

export async function upsertNotificationPreferences(
  userId: string,
  preferences: Partial<Omit<NotificationPreference, "id" | "user_id" | "created_at" | "updated_at">>,
): Promise<NotificationPreference | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("starsprout_notification_preferences")
    .upsert(
      {
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    )
    .select()
    .single()

  if (error) {
    console.error("[v0] Error upserting notification preferences:", error)
    return null
  }

  return data
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export async function getUserFeatureFlags(userId: string): Promise<FeatureFlag[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("starsprout_feature_flags")
    .select("*")
    .or(`user_id.eq.${userId},user_id.is.null`)
    .eq("is_enabled", true)

  if (error) {
    console.error("[v0] Error fetching feature flags:", error)
    return []
  }

  return data || []
}

export async function getHouseholdFeatureFlags(householdId: string): Promise<FeatureFlag[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("starsprout_feature_flags")
    .select("*")
    .or(`household_id.eq.${householdId},household_id.is.null`)
    .eq("is_enabled", true)

  if (error) {
    console.error("[v0] Error fetching household feature flags:", error)
    return []
  }

  return data || []
}

export async function isFeatureEnabled(flagKey: string, householdId: string, userId?: string): Promise<boolean> {
  const supabase = await createClient()

  let query = supabase
    .from("starsprout_feature_flags")
    .select("is_enabled")
    .eq("flag_key", flagKey)
    .eq("is_enabled", true)

  if (userId) {
    query = query.or(`user_id.eq.${userId},household_id.eq.${householdId},user_id.is.null,household_id.is.null`)
  } else {
    query = query.or(`household_id.eq.${householdId},household_id.is.null`)
  }

  const { data, error } = await supabase
    .from("starsprout_feature_flags")
    .select("is_enabled")
    .eq("flag_key", flagKey)
    .eq("is_enabled", true)
    .or(`user_id.eq.${userId},household_id.eq.${householdId}`)

  if (error || !data || data.length === 0) {
    return false
  }

  return true
}

export async function toggleFeatureFlag(
  flagKey: string,
  householdId: string,
  userId: string,
  isEnabled: boolean,
): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase.from("starsprout_feature_flags").upsert(
    {
      flag_key: flagKey,
      flag_name: flagKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      household_id: householdId,
      user_id: userId,
      is_enabled: isEnabled,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "flag_key,household_id,user_id",
    },
  )

  if (error) {
    console.error("[v0] Error toggling feature flag:", error)
    return false
  }

  return true
}

// ============================================================================
// AI FEATURE CHECKS
// ============================================================================

export async function isAIMotivationEnabled(householdId: string, userId: string): Promise<boolean> {
  return isFeatureEnabled("ai_motivation", householdId, userId)
}

export async function isAIReflectionEnabled(householdId: string, userId: string): Promise<boolean> {
  return isFeatureEnabled("ai_reflection", householdId, userId)
}

export async function isAIWeeklySummaryEnabled(householdId: string, userId: string): Promise<boolean> {
  return isFeatureEnabled("ai_weekly_summary", householdId, userId)
}
