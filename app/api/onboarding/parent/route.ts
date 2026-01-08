import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { createHousehold, createUser, recordConsents, assignStarterQuest, generateInviteCode } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      clerk_user_id,
      household_name,
      parent_nickname,
      child_nickname,
      child_avatar,
      child_age_band,
      consent_coppa,
      consent_ai,
      consent_social,
      starter_quest,
    } = body

    // 1. Create household
    const household = await createHousehold({ name: household_name })
    if (!household) {
      return NextResponse.json({ error: "Failed to create household" }, { status: 500 })
    }

    // 2. Create parent user
    const parent = await createUser({
      id: clerk_user_id,
      household_id: household.id,
      role: "parent",
      nickname: parent_nickname,
    })

    if (!parent) {
      return NextResponse.json({ error: "Failed to create parent user" }, { status: 500 })
    }

    // 3. Create child user (generate a temp ID for Clerk - parent will create proper account later)
    // For MVP, we'll create a placeholder child record
    const childId = `child_${household.id}_1` // Temporary ID pattern

    const child = await createUser({
      id: childId,
      household_id: household.id,
      role: "child",
      nickname: child_nickname,
      avatar_url: child_avatar,
      age_band: child_age_band as any,
    })

    if (!child) {
      return NextResponse.json({ error: "Failed to create child user" }, { status: 500 })
    }

    // 4. Record consents
    const consents = [
      {
        household_id: household.id,
        parent_id: clerk_user_id,
        child_id: childId,
        consent_type: "coppa" as const,
        granted: consent_coppa,
      },
      {
        household_id: household.id,
        parent_id: clerk_user_id,
        child_id: childId,
        consent_type: "ai_features" as const,
        granted: consent_ai,
      },
      {
        household_id: household.id,
        parent_id: clerk_user_id,
        child_id: childId,
        consent_type: "social_features" as const,
        granted: consent_social,
      },
    ]

    await recordConsents(consents)

    // 5. Assign starter quest
    await assignStarterQuest({
      household_id: household.id,
      assigned_to: childId,
      assigned_by: clerk_user_id,
      title: starter_quest.title,
      category: starter_quest.category,
      points: starter_quest.points,
    })

    // 6. Generate friend invite code for child
    await generateInviteCode({ child_id: childId })

    // 7. Update Clerk metadata
    const client = await clerkClient()
    await client.users.updateUserMetadata(clerk_user_id, {
      publicMetadata: {
        role: "parent",
        household_id: household.id,
        setup_complete: true,
      },
    })

    return NextResponse.json({
      success: true,
      household_id: household.id,
      child_id: childId,
    })
  } catch (error: any) {
    console.error("[v0] Parent onboarding error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
