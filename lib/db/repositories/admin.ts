// Admin Repository - System-wide analytics and household management
// Accessible only to admin users via requireAdmin() guard

import { createClient } from "@/lib/supabase/server"
import type { Household, User, ActivityEvent } from "../types"

// ============================================================================
// ADMIN KPIs
// ============================================================================

export interface AdminKPIs {
  total_households: number
  total_parents: number
  total_children: number
  active_households_7d: number
  pending_task_approvals: number
  pending_reward_requests: number
  pending_friend_approvals: number
  ai_calls_today: number
  ai_error_rate: number
}

export async function getAdminKPIs(): Promise<AdminKPIs> {
  const supabase = await createClient()

  // Total households
  const { count: totalHouseholds } = await supabase
    .from("starsprout_households")
    .select("*", { count: "exact", head: true })

  // Total parents
  const { count: totalParents } = await supabase
    .from("starsprout_users")
    .select("*", { count: "exact", head: true })
    .eq("role", "parent")

  // Total children
  const { count: totalChildren } = await supabase
    .from("starsprout_users")
    .select("*", { count: "exact", head: true })
    .eq("role", "child")

  // Active households (last 7 days)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { data: activeHouseholds } = await supabase
    .from("starsprout_activity_events")
    .select("household_id")
    .gte("created_at", weekAgo.toISOString())

  const uniqueActiveHouseholds = new Set(activeHouseholds?.map((e) => e.household_id) || []).size

  // Pending task approvals
  const { count: pendingTasks } = await supabase
    .from("starsprout_tasks")
    .select("*", { count: "exact", head: true })
    .eq("status", "submitted")

  // Pending reward requests
  const { count: pendingRewards } = await supabase
    .from("starsprout_reward_redemptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "requested")

  // Pending friend approvals
  const { count: pendingFriends } = await supabase
    .from("starsprout_friendships")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")

  // AI metrics (from activity events)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: aiEvents } = await supabase
    .from("starsprout_activity_events")
    .select("metadata")
    .gte("created_at", today.toISOString())
    .like("entity_type", "%ai%")

  const aiCallsToday = aiEvents?.length || 0
  const aiErrors = aiEvents?.filter((e) => e.metadata?.error === true).length || 0
  const aiErrorRate = aiCallsToday > 0 ? (aiErrors / aiCallsToday) * 100 : 0

  return {
    total_households: totalHouseholds || 0,
    total_parents: totalParents || 0,
    total_children: totalChildren || 0,
    active_households_7d: uniqueActiveHouseholds,
    pending_task_approvals: pendingTasks || 0,
    pending_reward_requests: pendingRewards || 0,
    pending_friend_approvals: pendingFriends || 0,
    ai_calls_today: aiCallsToday,
    ai_error_rate: Number(aiErrorRate.toFixed(2)),
  }
}

// ============================================================================
// HOUSEHOLD SEARCH
// ============================================================================

export interface HouseholdSearchParams {
  email?: string
  household_id?: string
  status?: string
}

export interface HouseholdSearchResult {
  id: string
  name: string
  status: string
  created_at: string
  parent_emails: string[]
  child_count: number
  last_activity: string | null
}

export async function searchHouseholds(params: HouseholdSearchParams): Promise<HouseholdSearchResult[]> {
  const supabase = await createClient()

  let query = supabase.from("starsprout_households").select("id, name, created_at")

  if (params.household_id) {
    query = query.eq("id", params.household_id)
  }

  const { data: households } = await query

  if (!households || households.length === 0) {
    return []
  }

  const results: HouseholdSearchResult[] = []

  for (const household of households) {
    // Get parents
    const { data: parents } = await supabase
      .from("starsprout_users")
      .select("id")
      .eq("household_id", household.id)
      .eq("role", "parent")

    // Get child count
    const { count: childCount } = await supabase
      .from("starsprout_users")
      .select("*", { count: "exact", head: true })
      .eq("household_id", household.id)
      .eq("role", "child")

    // Get last activity
    const { data: lastActivity } = await supabase
      .from("starsprout_activity_events")
      .select("created_at")
      .eq("household_id", household.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    // TODO: Get parent emails from Clerk if email filter provided
    const parentEmails: string[] = []

    results.push({
      id: household.id,
      name: household.name,
      status: "active", // TODO: Add status field to schema
      created_at: household.created_at,
      parent_emails: parentEmails,
      child_count: childCount || 0,
      last_activity: lastActivity?.created_at || null,
    })
  }

  return results
}

// ============================================================================
// HOUSEHOLD DETAIL
// ============================================================================

export interface HouseholdDetail {
  household: Household
  parents: User[]
  children: User[]
  recent_activity: ActivityEvent[]
  stats: {
    total_tasks: number
    completed_tasks: number
    total_rewards: number
    total_friendships: number
  }
}

export async function getHouseholdDetail(householdId: string): Promise<HouseholdDetail | null> {
  const supabase = await createClient()

  // Get household
  const { data: household } = await supabase.from("starsprout_households").select("*").eq("id", householdId).single()

  if (!household) return null

  // Get parents
  const { data: parents } = await supabase
    .from("starsprout_users")
    .select("*")
    .eq("household_id", householdId)
    .eq("role", "parent")

  // Get children
  const { data: children } = await supabase
    .from("starsprout_users")
    .select("*")
    .eq("household_id", householdId)
    .eq("role", "child")

  // Get recent activity
  const { data: recentActivity } = await supabase
    .from("starsprout_activity_events")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false })
    .limit(20)

  // Get stats
  const { count: totalTasks } = await supabase
    .from("starsprout_tasks")
    .select("*", { count: "exact", head: true })
    .eq("household_id", householdId)

  const { count: completedTasks } = await supabase
    .from("starsprout_tasks")
    .select("*", { count: "exact", head: true })
    .eq("household_id", householdId)
    .eq("status", "approved")

  const { count: totalRewards } = await supabase
    .from("starsprout_rewards")
    .select("*", { count: "exact", head: true })
    .eq("household_id", householdId)

  const { data: childIds } = await supabase
    .from("starsprout_users")
    .select("id")
    .eq("household_id", householdId)
    .eq("role", "child")

  let totalFriendships = 0
  if (childIds && childIds.length > 0) {
    const { count: friendshipCount } = await supabase
      .from("starsprout_friendships")
      .select("*", { count: "exact", head: true })
      .in(
        "child_id",
        childIds.map((c) => c.id),
      )

    totalFriendships = friendshipCount || 0
  }

  return {
    household,
    parents: parents || [],
    children: children || [],
    recent_activity: recentActivity || [],
    stats: {
      total_tasks: totalTasks || 0,
      completed_tasks: completedTasks || 0,
      total_rewards: totalRewards || 0,
      total_friendships: totalFriendships,
    },
  }
}

// ============================================================================
// ADMIN AUDIT LOG
// ============================================================================

export interface AdminAuditLog {
  id: string
  admin_user_id: string
  admin_email: string
  action: string
  target_type: string
  target_id: string
  before_state: Record<string, any> | null
  after_state: Record<string, any> | null
  metadata: Record<string, any> | null
  created_at: string
}

export async function logAdminAction(input: {
  admin_user_id: string
  admin_email: string
  action: string
  target_type: string
  target_id: string
  before_state?: Record<string, any>
  after_state?: Record<string, any>
  metadata?: Record<string, any>
}): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase.from("starsprout_activity_events").insert({
    household_id: "00000000-0000-0000-0000-000000000000", // Admin actions use special household ID
    user_id: null,
    event_type: "task_assigned", // Reuse event type system
    entity_type: `admin_${input.action}`,
    entity_id: input.target_id,
    metadata: {
      admin_user_id: input.admin_user_id,
      admin_email: input.admin_email,
      action: input.action,
      target_type: input.target_type,
      before_state: input.before_state || null,
      after_state: input.after_state || null,
      ...input.metadata,
    },
  })

  if (error) {
    console.error("[v0] Error logging admin action:", error)
    return false
  }

  return true
}
