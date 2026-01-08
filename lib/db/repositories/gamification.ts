// Gamification Repository - Streaks, badges, points

import { createClient } from "@/lib/supabase/server"
import { logActivity } from "./activity"
import type { Streak, Badge, UserPoints } from "../types"

// ============================================================================
// STREAKS
// ============================================================================

export async function updateStreakOnTaskCompletion(userId: string, householdId: string): Promise<boolean> {
  const supabase = await createClient()

  // Use the helper function created in SQL
  const { error } = await supabase.rpc("update_user_streak", {
    p_user_id: userId,
  })

  if (error) {
    console.error("[v0] Error updating streak:", error)
    return false
  }

  return true
}

export async function getUserStreak(userId: string): Promise<Streak | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("starsprout_streaks").select("*").eq("user_id", userId).single()

  if (error) {
    console.error("[v0] Error fetching streak:", error)
    return null
  }

  return data
}

// ============================================================================
// BADGES
// ============================================================================

export async function awardBadgeIfEligible(userId: string, householdId: string): Promise<string[]> {
  const supabase = await createClient()
  const awardedBadges: string[] = []

  // Get user's approved task count
  const { count: totalApproved } = await supabase
    .from("starsprout_tasks")
    .select("*", { count: "exact", head: true })
    .eq("assigned_to", userId)
    .eq("status", "approved")

  // First quest badge
  if (totalApproved === 1) {
    const awarded = await awardBadge(userId, householdId, "first_quest")
    if (awarded) awardedBadges.push("first_quest")
  }

  // Milestone badges (10, 25, 50, 100 quests)
  if (totalApproved === 10) {
    const awarded = await awardBadge(userId, householdId, "milestone_10")
    if (awarded) awardedBadges.push("milestone_10")
  }
  if (totalApproved === 25) {
    const awarded = await awardBadge(userId, householdId, "milestone_25")
    if (awarded) awardedBadges.push("milestone_25")
  }
  if (totalApproved === 50) {
    const awarded = await awardBadge(userId, householdId, "milestone_50")
    if (awarded) awardedBadges.push("milestone_50")
  }
  if (totalApproved === 100) {
    const awarded = await awardBadge(userId, householdId, "milestone_100")
    if (awarded) awardedBadges.push("milestone_100")
  }

  // Check streak badges
  const streak = await getUserStreak(userId)
  if (streak) {
    if (streak.current_streak === 3) {
      const awarded = await awardBadge(userId, householdId, "streak_3")
      if (awarded) awardedBadges.push("streak_3")
    }
    if (streak.current_streak === 7) {
      const awarded = await awardBadge(userId, householdId, "streak_7")
      if (awarded) awardedBadges.push("streak_7")
    }
    if (streak.current_streak === 14) {
      const awarded = await awardBadge(userId, householdId, "streak_14")
      if (awarded) awardedBadges.push("streak_14")
    }
    if (streak.current_streak === 30) {
      const awarded = await awardBadge(userId, householdId, "streak_30")
      if (awarded) awardedBadges.push("streak_30")
    }
  }

  // Check category-specific badges (10 in each category)
  const categories = ["chores", "homework", "kindness"]
  for (const category of categories) {
    const { count: categoryCount } = await supabase
      .from("starsprout_tasks")
      .select("*", { count: "exact", head: true })
      .eq("assigned_to", userId)
      .eq("status", "approved")
      .eq("category", category)

    if (categoryCount === 10) {
      const badgeKey = `category_${category}_10`
      const awarded = await awardBadge(userId, householdId, badgeKey)
      if (awarded) awardedBadges.push(badgeKey)
    }
  }

  return awardedBadges
}

export async function awardBadge(userId: string, householdId: string, badgeKey: string): Promise<boolean> {
  const supabase = await createClient()

  // Get badge by key
  const { data: badge } = await supabase.from("starsprout_badges").select("*").eq("badge_key", badgeKey).single()

  if (!badge) return false

  // Check if user already has this badge
  const { data: existingBadge } = await supabase
    .from("starsprout_user_badges")
    .select("*")
    .eq("user_id", userId)
    .eq("badge_id", badge.id)
    .single()

  if (existingBadge) return false

  // Award badge
  const { error } = await supabase.from("starsprout_user_badges").insert({
    household_id: householdId,
    user_id: userId,
    badge_id: badge.id,
  })

  if (error) {
    console.error("[v0] Error awarding badge:", error)
    return false
  }

  // Log activity
  await logActivity({
    household_id: householdId,
    user_id: userId,
    event_type: "badge_awarded",
    entity_type: "badge",
    entity_id: badge.id,
    metadata: { badge_key: badgeKey },
  })

  return true
}

export async function getUserBadges(userId: string): Promise<Badge[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("starsprout_user_badges")
    .select("*, badge:badge_id(*)")
    .eq("user_id", userId)
    .order("awarded_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching user badges:", error)
    return []
  }

  return data?.map((ub: any) => ub.badge).filter(Boolean) || []
}

// ============================================================================
// POINTS
// ============================================================================

export async function getUserPoints(userId: string): Promise<UserPoints | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("starsprout_user_points").select("*").eq("user_id", userId).single()

  if (error) {
    console.error("[v0] Error fetching user points:", error)
    return null
  }

  return data
}
