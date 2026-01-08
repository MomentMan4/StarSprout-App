import { type NextRequest, NextResponse } from "next/server"
import { generateDifficultyTuning } from "@/lib/ai"
import { auth } from "@clerk/nextjs/server"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rateLimitResult = await rateLimit(`ai_tuning:${userId}`, RATE_LIMITS.AI_TUNING)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        },
      )
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
