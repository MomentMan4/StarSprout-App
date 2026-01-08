import { type NextRequest, NextResponse } from "next/server"
import { generateMotivation } from "@/lib/ai"

export async function POST(request: NextRequest) {
  try {
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
