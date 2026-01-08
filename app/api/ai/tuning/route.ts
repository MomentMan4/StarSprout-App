import { type NextRequest, NextResponse } from "next/server"
import { generateDifficultyTuning, checkRateLimit } from "@/lib/ai"
import { auth } from "@clerk/nextjs/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limiting: 10 requests per hour
    if (!checkRateLimit(userId, 10, 3600000)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const { childNickname, ageBand, recentCompletionRate, categoryPerformance } = await request.json()

    const tuning = await generateDifficultyTuning({
      childNickname,
      ageBand,
      recentCompletionRate,
      categoryPerformance,
    })

    return NextResponse.json(tuning)
  } catch (error) {
    console.error("[v0] Error generating tuning:", error)
    return NextResponse.json(
      {
        recommendation: "Keep up the great work!",
        suggestedAdjustments: ["Continue current approach"],
      },
      { status: 200 },
    )
  }
}
