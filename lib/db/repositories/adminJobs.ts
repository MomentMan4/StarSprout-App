import { createClient } from "@/lib/supabase/server"
import { sendWeeklySummaryEmail } from "@/lib/email"
import { sendBulkNotifications } from "@/lib/notify"
import type { Household, User } from "../types"

// ============================================================================
// JOB EXECUTION REPOSITORY
// ============================================================================

export type JobType =
  | "recompute_leaderboards"
  | "recompute_streaks"
  | "regenerate_weekly_summary"
  | "replay_notifications"
export type JobStatus = "queued" | "running" | "success" | "error"
export type JobScope = "global" | "household"

export interface JobExecution {
  id: string
  job_type: JobType
  scope: JobScope
  scope_id: string | null
  parameters: Record<string, any>
  status: JobStatus
  started_at: string | null
  completed_at: string | null
  output: Record<string, any> | null
  error: string | null
}

// ============================================================================
// RECOMPUTE LEADERBOARDS
// ============================================================================

export async function runRecomputeLeaderboards(
  scope: JobScope,
  householdId?: string,
): Promise<{ success: boolean; affected: number; error?: string }> {
  const supabase = await createClient()

  try {
    let households: Household[] = []

    if (scope === "household" && householdId) {
      const { data } = await supabase.from("starsprout_households").select("*").eq("id", householdId).single()
      if (data) households = [data]
    } else {
      const { data } = await supabase.from("starsprout_households").select("*")
      households = data || []
    }

    let affectedCount = 0

    for (const household of households) {
      // Get all children in household
      const { data: children } = await supabase
        .from("starsprout_users")
        .select("id")
        .eq("household_id", household.id)
        .eq("role", "child")

      if (!children || children.length === 0) continue

      // Get friendships for these children
      const { data: friendships } = await supabase
        .from("starsprout_friendships")
        .select("child_id, friend_id")
        .in(
          "child_id",
          children.map((c) => c.id),
        )
        .eq("status", "approved")

      // Create unique set of child IDs in friend network
      const friendNetworkIds = new Set<string>()
      children.forEach((c) => friendNetworkIds.add(c.id))
      friendships?.forEach((f) => {
        friendNetworkIds.add(f.child_id)
        friendNetworkIds.add(f.friend_id)
      })

      // Calculate points for each child in network
      const leaderboardEntries: Array<{ child_id: string; points: number; rank: number }> = []

      for (const childId of friendNetworkIds) {
        const { data: child } = await supabase.from("starsprout_users").select("points").eq("id", childId).single()

        if (child) {
          leaderboardEntries.push({
            child_id: childId,
            points: child.points || 0,
            rank: 0, // Will be calculated
          })
        }
      }

      // Sort by points and assign ranks
      leaderboardEntries.sort((a, b) => b.points - a.points)
      leaderboardEntries.forEach((entry, index) => {
        entry.rank = index + 1
      })

      // Store in leaderboard snapshot table (if it exists)
      // For MVP, we're just recalculating - the real-time query handles display
      affectedCount += leaderboardEntries.length
    }

    return { success: true, affected: affectedCount }
  } catch (error) {
    console.error("[v0] Job error (recompute_leaderboards):", error)
    return { success: false, affected: 0, error: String(error) }
  }
}

// ============================================================================
// RECOMPUTE STREAKS
// ============================================================================

export async function runRecomputeStreaks(
  scope: JobScope,
  householdId?: string,
): Promise<{ success: boolean; affected: number; error?: string }> {
  const supabase = await createClient()

  try {
    let children: User[] = []

    if (scope === "household" && householdId) {
      const { data } = await supabase
        .from("starsprout_users")
        .select("*")
        .eq("household_id", householdId)
        .eq("role", "child")
      children = data || []
    } else {
      const { data } = await supabase.from("starsprout_users").select("*").eq("role", "child")
      children = data || []
    }

    let affectedCount = 0

    for (const child of children) {
      // Get all approved tasks ordered by completion date
      const { data: tasks } = await supabase
        .from("starsprout_tasks")
        .select("approved_at")
        .eq("child_id", child.id)
        .eq("status", "approved")
        .not("approved_at", "is", null)
        .order("approved_at", { ascending: true })

      if (!tasks || tasks.length === 0) {
        // Reset streak to 0
        await supabase.from("starsprout_users").update({ current_streak: 0 }).eq("id", child.id)
        affectedCount++
        continue
      }

      // Calculate current streak (consecutive days with at least one task)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      let currentStreak = 0
      const checkDate = new Date(today)

      // Look backwards day by day
      for (let i = 0; i < 365; i++) {
        const dayStart = new Date(checkDate)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(checkDate)
        dayEnd.setHours(23, 59, 59, 999)

        const hasTaskThisDay = tasks.some((task) => {
          const approvedDate = new Date(task.approved_at!)
          return approvedDate >= dayStart && approvedDate <= dayEnd
        })

        if (hasTaskThisDay) {
          currentStreak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          // Streak broken
          break
        }
      }

      // Update user's streak
      await supabase.from("starsprout_users").update({ current_streak: currentStreak }).eq("id", child.id)

      affectedCount++
    }

    return { success: true, affected: affectedCount }
  } catch (error) {
    console.error("[v0] Job error (recompute_streaks):", error)
    return { success: false, affected: 0, error: String(error) }
  }
}

// ============================================================================
// REGENERATE WEEKLY SUMMARY
// ============================================================================

export async function runRegenerateWeeklySummary(
  householdId: string,
  useAI = false,
): Promise<{ success: boolean; affected: number; error?: string }> {
  const supabase = await createClient()

  try {
    // Get household and parent
    const { data: household } = await supabase.from("starsprout_households").select("*").eq("id", householdId).single()

    if (!household) {
      return { success: false, affected: 0, error: "Household not found" }
    }

    const { data: parent } = await supabase
      .from("starsprout_users")
      .select("id")
      .eq("household_id", householdId)
      .eq("role", "parent")
      .limit(1)
      .single()

    if (!parent) {
      return { success: false, affected: 0, error: "Parent not found" }
    }

    // Get parent email from Clerk
    // In production, fetch from Clerk API
    const parentEmail = "parent@example.com" // Placeholder

    // Calculate week stats
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)

    const { data: children } = await supabase
      .from("starsprout_users")
      .select("nickname, id")
      .eq("household_id", householdId)
      .eq("role", "child")

    const childHighlights = []

    for (const child of children || []) {
      const { count: questsCompleted } = await supabase
        .from("starsprout_tasks")
        .select("*", { count: "exact", head: true })
        .eq("child_id", child.id)
        .eq("status", "approved")
        .gte("approved_at", weekStart.toISOString())

      const { data: childData } = await supabase
        .from("starsprout_users")
        .select("current_streak")
        .eq("id", child.id)
        .single()

      childHighlights.push({
        name: child.nickname || "Child",
        quests: questsCompleted || 0,
        streak: childData?.current_streak || 0,
      })
    }

    const totalQuests = childHighlights.reduce((sum, c) => sum + c.quests, 0)

    // Send email
    const emailSent = await sendWeeklySummaryEmail({
      to: parentEmail,
      parentName: "Parent", // Get from Clerk
      weekStart: weekStart.toISOString().split("T")[0],
      weekEnd: new Date().toISOString().split("T")[0],
      questsCompleted: totalQuests,
      badgesEarned: 0, // Calculate if needed
      childHighlights,
      strengths: useAI ? ["Growing responsibility", "Consistent effort"] : [],
      opportunities: useAI ? ["Try more variety in activities"] : [],
      dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL}/parent/dashboard`,
    })

    return { success: emailSent, affected: 1 }
  } catch (error) {
    console.error("[v0] Job error (regenerate_weekly_summary):", error)
    return { success: false, affected: 0, error: String(error) }
  }
}

// ============================================================================
// REPLAY NOTIFICATIONS
// ============================================================================

export async function runReplayNotifications(
  householdId: string,
  fromDate: string,
  toDate: string,
): Promise<{ success: boolean; affected: number; error?: string }> {
  const supabase = await createClient()

  try {
    // Get activity events in the time window for this household
    const { data: events } = await supabase
      .from("starsprout_activity_events")
      .select("*")
      .eq("household_id", householdId)
      .gte("created_at", fromDate)
      .lte("created_at", toDate)
      .order("created_at", { ascending: true })

    if (!events || events.length === 0) {
      return { success: true, affected: 0 }
    }

    // Replay notifications based on event types
    const notifications = []

    for (const event of events) {
      if (event.event_type === "quest_assigned" && event.user_id) {
        notifications.push({
          userId: event.user_id,
          title: "Quest Assigned (Replay)",
          content: `Historical notification replay for ${event.entity_type}`,
          category: "Quests" as const,
          actionUrl: "/kid/home",
        })
      }
      // Add more event type mappings as needed
    }

    if (notifications.length > 0) {
      await sendBulkNotifications(notifications)
    }

    return { success: true, affected: notifications.length }
  } catch (error) {
    console.error("[v0] Job error (replay_notifications):", error)
    return { success: false, affected: 0, error: String(error) }
  }
}
