"use server"

import { auth, clerkClient } from "@clerk/nextjs/server"
import { createHousehold, createUser, recordConsents, assignStarterQuest, generateInviteCode } from "@/lib/db"

interface OnboardingResponse {
  ok: boolean
  household_id?: string
  child_id?: string
  parent_id?: string
  app_user_id?: string // Added internal UUID for Clerk metadata
  error?: {
    message: string
    code?: string
    details?: string
  }
}

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
}): Promise<OnboardingResponse> {
  console.log("[onboarding:completeParentOnboarding] ========================================")
  console.log("[onboarding:completeParentOnboarding] Server action called")
  console.log("[onboarding:completeParentOnboarding] ========================================")

  try {
    console.log("[onboarding:completeParentOnboarding] Environment check:")
    console.log("[onboarding:completeParentOnboarding] - SUPABASE_URL exists:", !!process.env.SUPABASE_URL)
    console.log(
      "[onboarding:completeParentOnboarding] - SUPABASE_SERVICE_ROLE_KEY exists:",
      !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    )
    console.log("[onboarding:completeParentOnboarding] - CLERK_SECRET_KEY exists:", !!process.env.CLERK_SECRET_KEY)

    let userId: string | null = null
    const hasClerkKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY

    if (hasClerkKeys) {
      try {
        const authResult = await auth()
        userId = authResult.userId
        console.log("[onboarding:completeParentOnboarding] Clerk auth userId:", userId)
      } catch (authError) {
        console.error("[onboarding:completeParentOnboarding] Clerk auth error:", authError)
        return { ok: false, error: { message: "Authentication failed" } }
      }
    } else {
      console.log("[onboarding:completeParentOnboarding] Running in preview mode without Clerk")
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

    if (!household_name?.trim()) {
      return { ok: false, error: { message: "Household name is required", code: "VALIDATION_ERROR" } }
    }
    if (!child_nickname?.trim()) {
      return { ok: false, error: { message: "Child nickname is required", code: "VALIDATION_ERROR" } }
    }
    if (!child_age_band) {
      return { ok: false, error: { message: "Child age band is required", code: "VALIDATION_ERROR" } }
    }
    if (!starter_quest?.title) {
      return { ok: false, error: { message: "Starter quest is required", code: "VALIDATION_ERROR" } }
    }

    const effectiveUserId = clerk_user_id || `preview_parent_${Date.now()}`
    console.log("[onboarding:completeParentOnboarding] Effective user ID:", effectiveUserId)

    if (hasClerkKeys && userId && userId !== clerk_user_id) {
      console.error("[onboarding:completeParentOnboarding] User ID mismatch - auth:", userId, "body:", clerk_user_id)
      return { ok: false, error: { message: "User ID mismatch - unauthorized", code: "AUTH_ERROR" } }
    }

    console.log("[onboarding:completeParentOnboarding] Step 1: Creating household + parent user")
    const householdResult = await createHousehold({
      name: household_name,
      owner_clerk_user_id: effectiveUserId,
      owner_nickname: parent_nickname || "Parent",
    })

    if (householdResult.error || !householdResult.data) {
      console.error("[onboarding:completeParentOnboarding] ✗ Failed to create household")
      return {
        ok: false,
        error: {
          message: householdResult.error?.message || "Failed to create household",
          code: householdResult.error?.code,
          details: householdResult.error?.details,
        },
      }
    }

    const household = householdResult.data
    console.log("[onboarding:completeParentOnboarding] ✓ Household ready:", household.id)

    const parentAppUserId = household.owner_user_id
    if (!parentAppUserId) {
      console.error("[onboarding:completeParentOnboarding] ✗ No owner_user_id in household")
      return {
        ok: false,
        error: {
          message: "Failed to retrieve parent user ID",
          code: "MISSING_PARENT_ID",
        },
      }
    }
    console.log("[onboarding:completeParentOnboarding] ✓ Parent internal UUID:", parentAppUserId)

    console.log("[onboarding:completeParentOnboarding] Step 2: Creating child user")
    const childClerkId = `child_${household.id}_${Date.now()}`
    const childResult = await createUser({
      clerk_user_id: childClerkId,
      household_id: household.id,
      role: "child",
      nickname: child_nickname,
      avatar_url: child_avatar,
      age_band: child_age_band as any,
    })

    if (childResult.error || !childResult.data) {
      console.error("[onboarding:completeParentOnboarding] ✗ Failed to create child user")
      return {
        ok: false,
        error: {
          message: childResult.error?.message || "Failed to create child user",
          code: childResult.error?.code,
          details: childResult.error?.details,
        },
      }
    }

    const child = childResult.data
    console.log("[onboarding:completeParentOnboarding] ✓ Child created:", {
      internal_id: child.id,
      clerk_id: child.clerk_user_id,
    })

    console.log("[onboarding:completeParentOnboarding] Step 3: Recording consents")
    const consents = [
      {
        household_id: household.id,
        parent_id: parentAppUserId, // Internal UUID
        child_id: child.id, // Internal UUID
        consent_type: "coppa" as const,
        granted: consent_coppa,
      },
      {
        household_id: household.id,
        parent_id: parentAppUserId,
        child_id: child.id,
        consent_type: "ai_features" as const,
        granted: consent_ai || false,
      },
      {
        household_id: household.id,
        parent_id: parentAppUserId,
        child_id: child.id,
        consent_type: "social_features" as const,
        granted: consent_social || false,
      },
    ]

    const consentsRecorded = await recordConsents(consents)
    if (!consentsRecorded) {
      console.error("[onboarding:completeParentOnboarding] ✗ Failed to record consents (non-critical)")
    } else {
      console.log("[onboarding:completeParentOnboarding] ✓ Consents recorded")
    }

    console.log("[onboarding:completeParentOnboarding] Step 4: Assigning starter quest:", starter_quest.title)
    try {
      await assignStarterQuest({
        household_id: household.id,
        assigned_to: child.id, // Internal UUID
        assigned_by: parentAppUserId, // Internal UUID
        title: starter_quest.title,
        category: starter_quest.category,
        points: starter_quest.points,
      })
      console.log("[onboarding:completeParentOnboarding] ✓ Starter quest assigned")
    } catch (questError: any) {
      console.error(
        "[onboarding:completeParentOnboarding] ✗ Failed to assign starter quest (non-critical):",
        questError,
      )
    }

    // Step 5: Generate friend invite code
    console.log("[onboarding:completeParentOnboarding] Step 5: Generating invite code")
    try {
      const inviteCode = await generateInviteCode({ child_id: child.id }) // Internal UUID
      if (inviteCode) {
        console.log("[onboarding:completeParentOnboarding] ✓ Invite code generated:", inviteCode.code)
      }
    } catch (inviteError: any) {
      console.error(
        "[onboarding:completeParentOnboarding] ✗ Failed to generate invite code (non-critical):",
        inviteError,
      )
    }

    if (hasClerkKeys && userId) {
      console.log("[onboarding:completeParentOnboarding] Step 6: Updating Clerk metadata")
      try {
        const client = await clerkClient()
        await client.users.updateUserMetadata(effectiveUserId, {
          publicMetadata: {
            role: "parent",
            household_id: household.id,
            app_user_id: parentAppUserId, // Store internal UUID in Clerk
            setup_complete: true,
          },
        })
        console.log("[onboarding:completeParentOnboarding] ✓ Clerk metadata updated with app_user_id")
      } catch (clerkError: any) {
        console.error(
          "[onboarding:completeParentOnboarding] ✗ Failed to update Clerk metadata (non-critical):",
          clerkError,
        )
      }
    }

    console.log("[onboarding:completeParentOnboarding] ========================================")
    console.log("[onboarding:completeParentOnboarding] ✓✓✓ Onboarding completed successfully")
    console.log("[onboarding:completeParentOnboarding] ========================================")

    return {
      ok: true,
      household_id: household.id,
      child_id: child.clerk_user_id, // Return Clerk ID for client
      parent_id: effectiveUserId, // Return Clerk ID for client
      app_user_id: parentAppUserId, // Return internal UUID
    }
  } catch (error: any) {
    console.error("[onboarding:completeParentOnboarding] ========================================")
    console.error("[onboarding:completeParentOnboarding] ✗✗✗ FATAL ERROR in parent onboarding")
    console.error("[onboarding:completeParentOnboarding] Error message:", error.message)
    console.error("[onboarding:completeParentOnboarding] Error stack:", error.stack)
    console.error("[onboarding:completeParentOnboarding] ========================================")

    return {
      ok: false,
      error: {
        message: error.message || "Internal server error during onboarding",
        code: "UNEXPECTED_ERROR",
      },
    }
  }
}
