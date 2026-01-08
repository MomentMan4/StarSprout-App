import { type NextRequest, NextResponse } from "next/server"
import { generateReflectionPrompt } from "@/lib/ai"
import { isAIReflectionEnabled } from "@/lib/db/repositories/settings"
import { auth } from "@clerk/nextjs/server"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rateLimitResult = await rateLimit(`ai_reflection:${userId}`, RATE_LIMITS.AI_REFLECTION)
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

    const { questTitle, childNickname, ageBand, householdId } = await request.json()

    // Check if AI reflection is enabled for this household
    const isEnabled = await isAIReflectionEnabled(householdId, userId)
    if (!isEnabled) {
      // Return a simple fallback if AI is disabled
      return NextResponse.json({ text: "How did that make you feel?" })
    }

    const question = await generateReflectionPrompt({
      childNickname,
      ageBand,
      questTitle,
    })

    return NextResponse.json({ text: question })
  } catch (error) {
    console.error("[v0] Error generating reflection:", error)
    return NextResponse.json({ text: "What did you enjoy about this?" }, { status: 200 })
  }
}
