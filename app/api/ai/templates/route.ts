import { type NextRequest, NextResponse } from "next/server"
import { generateQuestTemplates, checkRateLimit } from "@/lib/ai"
import { auth } from "@clerk/nextjs/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limiting: 5 requests per minute
    if (!checkRateLimit(userId, 5, 60000)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const { scenario, ageBand, count } = await request.json()

    const templates = await generateQuestTemplates({
      scenario,
      ageBand,
      count: count || 3,
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error("[v0] Error generating templates:", error)
    return NextResponse.json({ templates: [] }, { status: 200 })
  }
}
