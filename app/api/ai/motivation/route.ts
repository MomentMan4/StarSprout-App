import { type NextRequest, NextResponse } from "next/server"
import { generateMotivation } from "@/lib/ai"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { auth } from "@clerk/nextjs/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rateLimitResult = await rateLimit(`ai_motivation:${userId}`, RATE_LIMITS.AI_MOTIVATION)
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

    const { questTitle, childNickname, ageBand } = await request.json()

    const message = await generateMotivation({
      childNickname,
      ageBand,
      questTitle,
      questCategory: "general",
    })

    return NextResponse.json({ text: message })
  } catch (error) {
    console.error("[v0] Error generating motivation:", error)
    return NextResponse.json({ text: "Great job! Keep up the awesome work!" }, { status: 200 })
  }
}
