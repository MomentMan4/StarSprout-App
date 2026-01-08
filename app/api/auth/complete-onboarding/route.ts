import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { role, household_id, age_band } = body

    if (!role || !household_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Update Clerk user metadata
    const client = await clerkClient()
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        role,
        household_id,
        age_band: age_band || null,
        setup_complete: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error completing onboarding:", error)
    return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 })
  }
}
