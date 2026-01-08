import { requireParent } from "@/lib/auth"
import { ParentDashboardClient } from "@/components/parent/parent-dashboard-client"
import { getDashboardStats } from "@/lib/db/repositories/analytics"
import { createClient } from "@/lib/supabase/server"

export default async function ParentDashboardPage() {
  const user = await requireParent()
  const supabase = await createClient()

  // Get dashboard stats
  const stats = await getDashboardStats(user.householdId)

  // Get children
  const { data: children } = await supabase
    .from("starsprout_users")
    .select("*, points:starsprout_user_points(*), streak:starsprout_streaks(*)")
    .eq("household_id", user.householdId)
    .eq("role", "child")

  // Get weekly summary if exists
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const { data: weeklySummary } = await supabase
    .from("starsprout_weekly_summaries")
    .select("*")
    .eq("household_id", user.householdId)
    .gte("week_start", weekAgo.toISOString())
    .order("week_start", { ascending: false })
    .limit(1)
    .single()

  // Get this week's quest completion data for chart
  const { data: weeklyTasks } = await supabase
    .from("starsprout_tasks")
    .select("approved_at, category")
    .eq("household_id", user.householdId)
    .eq("status", "approved")
    .gte("approved_at", weekAgo.toISOString())

  return (
    <ParentDashboardClient
      user={user}
      stats={stats}
      children={children || []}
      weeklySummary={weeklySummary}
      weeklyTasks={weeklyTasks || []}
    />
  )
}
