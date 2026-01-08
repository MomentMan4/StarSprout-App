import { type NextRequest, NextResponse } from "next/server"
import { generateReflectionPrompt, checkRateLimit } from "@/lib/ai"
import { isAIReflectionEnabled } from "@/lib/db/repositories/settings"
import { auth } from "@clerk/nextjs/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limiting: 10 requests per minute
    if (!checkRateLimit(userId, 10, 60000)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
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
