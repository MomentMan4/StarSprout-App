// Analytics Repository - Dashboard stats and weekly summaries

import { createClient } from "@/lib/supabase/server"
import type { DashboardStats, ChildStats } from "../types"

// ============================================================================
// PARENT DASHBOARD STATS
// ============================================================================

export async function getDashboardStats(householdId: string): Promise<DashboardStats> {
  const supabase = await createClient()

  // Get total children
  const { count: totalChildren } = await supabase
    .from("starsprout_users")
    .select("*", { count: "exact", head: true })
    .eq("household_id", householdId)
    .eq("role", "child")

  // Get pending task approvals
  const { count: pendingApprovals } = await supabase
    .from("starsprout_tasks")
    .select("*", { count: "exact", head: true })
    .eq("household_id", householdId)
    .eq("status", "submitted")

  // Get pending redemptions
  const { count: pendingRedemptions } = await supabase
    .from("starsprout_reward_redemptions")
    .select("*", { count: "exact", head: true })
    .eq("household_id", householdId)
    .eq("status", "requested")

  // Get weekly completions (last 7 days)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { count: weeklyCompletions } = await supabase
    .from("starsprout_tasks")
    .select("*", { count: "exact", head: true })
    .eq("household_id", householdId)
    .eq("status", "approved")
    .gte("approved_at", weekAgo.toISOString())

  // Get active streaks (current_streak > 0)
  const { count: activeStreaks } = await supabase
    .from("starsprout_streaks")
    .select("*", { count: "exact", head: true })
    .eq("household_id", householdId)
    .gt("current_streak", 0)

  return {
    total_children: totalChildren || 0,
    pending_approvals: pendingApprovals || 0,
    pending_redemptions: pendingRedemptions || 0,
    weekly_completions: weeklyCompletions || 0,
    active_streaks: activeStreaks || 0,
  }
}

// ============================================================================
// CHILD STATS
// ============================================================================

export async function getChildStats(userId: string): Promise<ChildStats> {
  const supabase = await createClient()

  // Get points
  const { data: points } = await supabase.from("starsprout_user_points").select("*").eq("user_id", userId).single()

  // Get streak
  const { data: streak } = await supabase.from("starsprout_streaks").select("*").eq("user_id", userId).single()

  // Get badge count
  const { count: badgeCount } = await supabase
    .from("starsprout_user_badges")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  // Get total quests completed
  const { count: questsCompleted } = await supabase
    .from("starsprout_tasks")
    .select("*", { count: "exact", head: true })
    .eq("assigned_to", userId)
    .eq("status", "approved")

  return {
    total_points: points?.total_points || 0,
    available_points: points?.available_points || 0,
    weekly_points: points?.weekly_points || 0,
    current_streak: streak?.current_streak || 0,
    longest_streak: streak?.longest_streak || 0,
    total_badges: badgeCount || 0,
    total_quests_completed: questsCompleted || 0,
  }
}
