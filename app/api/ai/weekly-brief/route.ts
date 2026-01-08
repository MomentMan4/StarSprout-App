import { type NextRequest, NextResponse } from "next/server"
import { generateWeeklyBrief, checkRateLimit } from "@/lib/ai"
import { isAIWeeklySummaryEnabled } from "@/lib/db/repositories/settings"
import { auth } from "@clerk/nextjs/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limiting: 5 requests per hour for expensive AI calls
    if (!checkRateLimit(userId, 5, 3600000)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const { householdId, householdName, childrenNames, questsCompleted, categoriesData, streakData } =
      await request.json()

    // Check if AI weekly summary is enabled
    const isEnabled = await isAIWeeklySummaryEnabled(householdId, userId)
    if (!isEnabled) {
      // Return fallback summary
      return NextResponse.json({
        summary: `This week, ${householdName} completed ${questsCompleted} quests! Great progress building habits.`,
        strengths: ["Consistent effort", "Good progress", "Building momentum"],
        opportunities: ["Keep going", "Try new categories", "Set stretch goals"],
        suggestedPraise: "Great work this week!",
      })
    }

    const brief = await generateWeeklyBrief({
      householdName,
      childrenNames,
      questsCompleted,
      categoriesData,
      streakData,
    })

    return NextResponse.json(brief)
  } catch (error) {
    console.error("[v0] Error generating weekly brief:", error)
    return NextResponse.json(
      {
        summary: "Great progress this week!",
        strengths: ["Good effort"],
        opportunities: ["Keep going"],
        suggestedPraise: "Well done!",
      },
      { status: 200 },
    )
  }
}
