import { type NextRequest, NextResponse } from "next/server"
import { sendWeeklySummaryEmail } from "@/lib/email"
import { createClient } from "@/lib/supabase/server"

// Cron job endpoint to send weekly summaries
// Configure in Vercel: Sunday 8pm PT (Mon 4am UTC)
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // Get all households with email summaries enabled
    const { data: households } = await supabase
      .from("starsprout_notification_preferences")
      .select("household_id, user_id")
      .eq("email_weekly_summary", true)

    if (!households || households.length === 0) {
      return NextResponse.json({ message: "No households with email enabled" })
    }

    let sent = 0
    let failed = 0

    for (const pref of households) {
      try {
        // Get parent user
        const { data: parent } = await supabase
          .from("starsprout_users")
          .select("clerk_user_id, display_name, email")
          .eq("id", pref.user_id)
          .single()

        if (!parent?.email) continue

        // Get household data
        const { data: household } = await supabase
          .from("starsprout_households")
          .select("name")
          .eq("id", pref.household_id)
          .single()

        // Get weekly summary data
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - 7)
        const weekEnd = new Date()

        const { data: tasks } = await supabase
          .from("starsprout_tasks")
          .select("*")
          .eq("household_id", pref.household_id)
          .eq("status", "approved")
          .gte("approved_at", weekStart.toISOString())

        const questsCompleted = tasks?.length || 0

        const { data: badges } = await supabase
          .from("starsprout_user_badges")
          .select("*")
          .eq("household_id", pref.household_id)
          .gte("awarded_at", weekStart.toISOString())

        const badgesEarned = badges?.length || 0

        // Get child highlights
        const { data: children } = await supabase
          .from("starsprout_users")
          .select("id, display_name")
          .eq("household_id", pref.household_id)
          .eq("role", "child")

        const childHighlights = await Promise.all(
          (children || []).map(async (child) => {
            const { count: quests } = await supabase
              .from("starsprout_tasks")
              .select("*", { count: "exact", head: true })
              .eq("assigned_to", child.id)
              .eq("status", "approved")
              .gte("approved_at", weekStart.toISOString())

            const { data: streak } = await supabase
              .from("starsprout_streaks")
              .select("current_streak")
              .eq("user_id", child.id)
              .single()

            return {
              name: child.display_name,
              quests: quests || 0,
              streak: streak?.current_streak || 0,
            }
          }),
        )

        // Simple fallback insights (AI endpoint would provide better ones)
        const strengths = []
        const opportunities = []

        if (questsCompleted >= 10) {
          strengths.push("Great consistency with daily quests!")
        }
        if (badgesEarned > 0) {
          strengths.push(`Earned ${badgesEarned} new badge${badgesEarned > 1 ? "s" : ""} this week`)
        }

        if (questsCompleted < 5) {
          opportunities.push("Try assigning more quests to build momentum")
        }

        const dashboardLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/parent/dashboard?week=this`

        await sendWeeklySummaryEmail({
          to: parent.email,
          parentName: parent.display_name,
          weekStart: weekStart.toLocaleDateString(),
          weekEnd: weekEnd.toLocaleDateString(),
          questsCompleted,
          badgesEarned,
          childHighlights: childHighlights.filter((c) => c.quests > 0),
          strengths,
          opportunities,
          dashboardLink,
        })

        sent++
      } catch (error) {
        console.error("[v0] Failed to send email for household:", pref.household_id, error)
        failed++
      }
    }

    return NextResponse.json({ sent, failed })
  } catch (error) {
    console.error("[v0] Weekly summary cron error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
