"use server"

import { auth, clerkClient } from "@clerk/nextjs/server"
import { createHousehold, createUser, recordConsents, assignStarterQuest, generateInviteCode } from "@/lib/db"

export async function completeParentOnboarding(formData: {
  clerk_user_id: string
  household_name: string
  parent_nickname: string
  child_nickname: string
  child_avatar: string | null
  child_age_band: string
  consent_coppa: boolean
  consent_ai: boolean
  consent_social: boolean
  starter_quest: {
    title: string
    category: string
    points: number
  }
}) {
  console.log("[v0] ========================================")
  console.log("[v0] Parent onboarding server action called")
  console.log("[v0] ========================================")

  try {
    console.log("[v0] Environment check:")
    console.log("[v0] - SUPABASE_URL exists:", !!process.env.SUPABASE_URL)
    console.log("[v0] - SUPABASE_ANON_KEY exists:", !!process.env.SUPABASE_ANON_KEY)
    console.log("[v0] - CLERK_SECRET_KEY exists:", !!process.env.CLERK_SECRET_KEY)

    let userId: string | null = null
    const hasClerkKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY

    if (hasClerkKeys) {
      try {
        const authResult = await auth()
        userId = authResult.userId
        console.log("[v0] Clerk auth userId:", userId)
      } catch (authError) {
        console.error("[v0] Clerk auth error:", authError)
        return { success: false, error: "Authentication failed" }
      }
    } else {
      console.log("[v0] Running in preview mode without Clerk authentication")
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
    } = formData

    // Validation
    if (!household_name) return { success: false, error: "Missing household_name" }
    if (!child_nickname) return { success: false, error: "Missing child_nickname" }
    if (!child_age_band) return { success: false, error: "Missing child_age_band" }
    if (!starter_quest || !starter_quest.title) return { success: false, error: "Missing starter_quest" }

    const effectiveUserId = clerk_user_id || `preview_parent_${Date.now()}`
    console.log("[v0] Effective user ID:", effectiveUserId)

    if (hasClerkKeys && userId && userId !== clerk_user_id) {
      console.error("[v0] User ID mismatch - auth:", userId, "body:", clerk_user_id)
      return { success: false, error: "User ID mismatch - unauthorized" }
    }

    // 1. Create household
    console.log("[v0] Step 1: Creating household:", household_name)
    const household = await createHousehold({ name: household_name })
    if (!household) {
      console.error("[v0] ✗ Failed to create household")
      return { success: false, error: "Failed to create household" }
    }
    console.log("[v0] ✓ Household created:", household.id)

    // 2. Create parent user
    console.log("[v0] Step 2: Creating parent user:", effectiveUserId)
    const parent = await createUser({
      id: effectiveUserId,
      household_id: household.id,
      role: "parent",
      nickname: parent_nickname || "Parent",
    })
    if (!parent) {
      console.error("[v0] ✗ Failed to create parent user")
      return { success: false, error: "Failed to create parent user" }
    }
    console.log("[v0] ✓ Parent created:", parent.id)

    // 3. Create child user
    const childId = `child_${household.id}_${Date.now()}`
    console.log("[v0] Step 3: Creating child user:", childId)
    const child = await createUser({
      id: childId,
      household_id: household.id,
      role: "child",
      nickname: child_nickname,
      avatar_url: child_avatar,
      age_band: child_age_band as any,
    })
    if (!child) {
      console.error("[v0] ✗ Failed to create child user")
      return { success: false, error: "Failed to create child user" }
    }
    console.log("[v0] ✓ Child created:", child.id)

    // 4. Record consents
    console.log("[v0] Step 4: Recording consents")
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
      console.error("[v0] ✗ Failed to record consents")
      return { success: false, error: "Failed to record consents" }
    }
    console.log("[v0] ✓ Consents recorded")

    // 5. Assign starter quest
    console.log("[v0] Step 5: Assigning starter quest:", starter_quest.title)
    try {
      await assignStarterQuest({
        household_id: household.id,
        assigned_to: childId,
        assigned_by: effectiveUserId,
        title: starter_quest.title,
        category: starter_quest.category,
        points: starter_quest.points,
      })
      console.log("[v0] ✓ Starter quest assigned")
    } catch (questError) {
      console.error("[v0] ✗ Failed to assign starter quest:", questError)
      // Non-critical - continue
    }

    // 6. Generate friend invite code
    console.log("[v0] Step 6: Generating invite code")
    try {
      const inviteCode = await generateInviteCode({ child_id: childId })
      if (inviteCode) {
        console.log("[v0] ✓ Invite code generated:", inviteCode.code)
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
    }

    console.log("[v0] ========================================")
    console.log("[v0] ✓✓✓ Onboarding completed successfully")
    console.log("[v0] ========================================")

    return {
      success: true,
      household_id: household.id,
      child_id: childId,
      parent_id: effectiveUserId,
    }
  } catch (error: any) {
    console.error("[v0] ========================================")
    console.error("[v0] ✗✗✗ FATAL ERROR in parent onboarding")
    console.error("[v0] Error message:", error.message)
    console.error("[v0] Error stack:", error.stack)
    console.error("[v0] ========================================")

    return {
      success: false,
      error: error.message || "Internal server error during onboarding",
    }
  }
}
