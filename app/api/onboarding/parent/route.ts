import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { createHousehold, createUser, recordConsents, assignStarterQuest, generateInviteCode } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  console.log("[v0] ========================================")
  console.log("[v0] Parent onboarding POST route called")
  console.log("[v0] ========================================")

  try {
    console.log("[v0] Environment check:")
    console.log("[v0] - SUPABASE_URL exists:", !!process.env.SUPABASE_URL)
    console.log("[v0] - NEXT_PUBLIC_SUPABASE_URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log("[v0] - SUPABASE_ANON_KEY exists:", !!process.env.SUPABASE_ANON_KEY)
    console.log("[v0] - NEXT_PUBLIC_SUPABASE_ANON_KEY exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    console.log("[v0] - CLERK_SECRET_KEY exists:", !!process.env.CLERK_SECRET_KEY)
    console.log("[v0] - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY exists:", !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

    let userId: string | null = null
    const hasClerkKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY

    if (hasClerkKeys) {
      try {
        const authResult = await auth()
        userId = authResult.userId
        console.log("[v0] Clerk auth userId:", userId)
      } catch (authError) {
        console.error("[v0] Clerk auth error:", authError)
        return NextResponse.json({ error: "Authentication failed", details: String(authError) }, { status: 401 })
      }
    } else {
      console.log("[v0] Running in preview mode without Clerk authentication")
    }

    let body
    try {
      const rawBody = await request.text()
      console.log("[v0] Raw request body length:", rawBody.length)
      body = JSON.parse(rawBody)
      console.log("[v0] Received onboarding data:", {
        household_name: body.household_name,
        child_nickname: body.child_nickname,
        clerk_user_id: body.clerk_user_id,
        has_starter_quest: !!body.starter_quest,
      })
    } catch (parseError) {
      console.error("[v0] Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Invalid JSON in request body", details: String(parseError) }, { status: 400 })
    }

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

    if (!household_name) {
      return NextResponse.json({ error: "Missing household_name" }, { status: 400 })
    }
    if (!child_nickname) {
      return NextResponse.json({ error: "Missing child_nickname" }, { status: 400 })
    }
    if (!child_age_band) {
      return NextResponse.json({ error: "Missing child_age_band" }, { status: 400 })
    }
    if (!starter_quest || !starter_quest.title) {
      return NextResponse.json({ error: "Missing starter_quest" }, { status: 400 })
    }

    const effectiveUserId = clerk_user_id || `preview_parent_${Date.now()}`
    console.log("[v0] Effective user ID:", effectiveUserId)

    if (hasClerkKeys && userId && userId !== clerk_user_id) {
      console.error("[v0] User ID mismatch - auth:", userId, "body:", clerk_user_id)
      return NextResponse.json({ error: "User ID mismatch - unauthorized" }, { status: 401 })
    }

    // 1. Create household
    console.log("[v0] Step 1: Creating household:", household_name)
    let household
    try {
      household = await createHousehold({ name: household_name })
      if (!household) {
        throw new Error("createHousehold returned null")
      }
      console.log("[v0] ✓ Household created:", household.id)
    } catch (householdError) {
      console.error("[v0] ✗ Failed to create household:", householdError)
      return NextResponse.json(
        { error: "Failed to create household", details: String(householdError) },
        { status: 500 },
      )
    }

    // 2. Create parent user
    console.log("[v0] Step 2: Creating parent user:", effectiveUserId)
    let parent
    try {
      parent = await createUser({
        id: effectiveUserId,
        household_id: household.id,
        role: "parent",
        nickname: parent_nickname || "Parent",
      })
      if (!parent) {
        throw new Error("createUser returned null for parent")
      }
      console.log("[v0] ✓ Parent created:", parent.id)
    } catch (parentError) {
      console.error("[v0] ✗ Failed to create parent user:", parentError)
      return NextResponse.json({ error: "Failed to create parent user", details: String(parentError) }, { status: 500 })
    }

    // 3. Create child user
    const childId = `child_${household.id}_${Date.now()}`
    console.log("[v0] Step 3: Creating child user:", childId)
    let child
    try {
      child = await createUser({
        id: childId,
        household_id: household.id,
        role: "child",
        nickname: child_nickname,
        avatar_url: child_avatar,
        age_band: child_age_band as any,
      })
      if (!child) {
        throw new Error("createUser returned null for child")
      }
      console.log("[v0] ✓ Child created:", child.id)
    } catch (childError) {
      console.error("[v0] ✗ Failed to create child user:", childError)
      return NextResponse.json({ error: "Failed to create child user", details: String(childError) }, { status: 500 })
    }

    // 4. Record consents
    console.log("[v0] Step 4: Recording consents")
    try {
      const consents = [
        {
          household_id: household.id,
          parent_id: effectiveUserId,
          child_id: childId,
          consent_type: "coppa" as const,
          granted: consent_coppa,
        },
        {
          household_id: household.id,
          parent_id: effectiveUserId,
          child_id: childId,
          consent_type: "ai_features" as const,
          granted: consent_ai || false,
        },
        {
          household_id: household.id,
          parent_id: effectiveUserId,
          child_id: childId,
          consent_type: "social_features" as const,
          granted: consent_social || false,
        },
      ]

      const consentsRecorded = await recordConsents(consents)
      if (!consentsRecorded) {
        throw new Error("recordConsents returned false")
      }
      console.log("[v0] ✓ Consents recorded")
    } catch (consentError) {
      console.error("[v0] ✗ Failed to record consents:", consentError)
      return NextResponse.json({ error: "Failed to record consents", details: String(consentError) }, { status: 500 })
    }

    // 5. Assign starter quest
    console.log("[v0] Step 5: Assigning starter quest:", starter_quest.title)
    try {
      const questAssigned = await assignStarterQuest({
        household_id: household.id,
        assigned_to: childId,
        assigned_by: effectiveUserId,
        title: starter_quest.title,
        category: starter_quest.category,
        points: starter_quest.points,
      })
      if (!questAssigned) {
        throw new Error("assignStarterQuest returned false")
      }
      console.log("[v0] ✓ Starter quest assigned")
    } catch (questError) {
      console.error("[v0] ✗ Failed to assign starter quest:", questError)
      // Non-critical - continue
      console.log("[v0] Continuing despite quest assignment failure")
    }

    // 6. Generate friend invite code
    console.log("[v0] Step 6: Generating invite code")
    let inviteCode
    try {
      inviteCode = await generateInviteCode({ child_id: childId })
      if (inviteCode) {
        console.log("[v0] ✓ Invite code generated:", inviteCode.code)
      } else {
        console.log("[v0] Invite code generation returned null (non-critical)")
      }
    } catch (inviteError) {
      console.error("[v0] ✗ Failed to generate invite code:", inviteError)
      // Non-critical - continue
    }

    // 7. Update Clerk metadata
    if (hasClerkKeys && userId) {
      console.log("[v0] Step 7: Updating Clerk metadata")
      try {
        const client = await clerkClient()
        await client.users.updateUserMetadata(effectiveUserId, {
          publicMetadata: {
            role: "parent",
            household_id: household.id,
            setup_complete: true,
          },
        })
        console.log("[v0] ✓ Clerk metadata updated")
      } catch (clerkError) {
        console.error("[v0] ✗ Failed to update Clerk metadata:", clerkError)
        // Non-critical - continue
      }
    } else {
      console.log("[v0] Step 7: Skipping Clerk metadata update (not configured or no userId)")
    }

    console.log("[v0] ========================================")
    console.log("[v0] ✓✓✓ Onboarding completed successfully")
    console.log("[v0] ========================================")

    const response = {
      success: true,
      household_id: household.id,
      child_id: childId,
      parent_id: effectiveUserId,
    }

    console.log("[v0] Returning response:", response)
    return NextResponse.json(response, { status: 200 })
  } catch (error: any) {
    console.error("[v0] ========================================")
    console.error("[v0] ✗✗✗ FATAL ERROR in parent onboarding")
    console.error("[v0] Error message:", error.message)
    console.error("[v0] Error stack:", error.stack)
    console.error("[v0] Error object:", error)
    console.error("[v0] ========================================")

    return NextResponse.json(
      {
        error: "Internal server error during onboarding",
        message: error.message || "Unknown error",
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}
