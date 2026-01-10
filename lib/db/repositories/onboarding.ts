// Onboarding Repository - Handles household setup and user creation

import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/db/supabaseAdmin"
import { logActivity } from "../repositories/activity"
import type {
  CreateHouseholdInput,
  CreateUserInput,
  CreateConsentInput,
  Household,
  User,
  Consent,
  AssignTaskInput,
  CreateInviteCodeInput,
  InviteCode,
} from "../types"

export interface SupabaseStructuredError {
  message: string
  code?: string
  details?: string
  hint?: string
}

// ============================================================================
// HOUSEHOLD CREATION (IDEMPOTENT)
// ============================================================================

export async function createHousehold(
  input: CreateHouseholdInput & { owner_clerk_user_id: string; owner_nickname?: string; owner_avatar_url?: string },
): Promise<{ data: Household | null; error: SupabaseStructuredError | null }> {
  console.log("[onboarding:createHousehold] Called with input:", {
    name: input.name,
    owner_clerk_user_id: input.owner_clerk_user_id,
  })

  const supabase = getSupabaseAdmin()

  try {
    console.log("[onboarding:createHousehold] Calling upsert_household_for_parent function")

    const { data, error } = await supabase.rpc("upsert_household_for_parent", {
      p_clerk_user_id: input.owner_clerk_user_id,
      p_household_name: input.name,
      p_parent_nickname: input.owner_nickname || "Parent",
      p_parent_avatar_url: input.owner_avatar_url || null,
    })

    if (error) {
      console.error("[onboarding:createHousehold] ✗✗✗ HOUSEHOLD CREATION ERROR ✗✗✗")
      console.error("[onboarding:createHousehold] Error code:", error.code)
      console.error("[onboarding:createHousehold] Error message:", error.message)
      console.error("[onboarding:createHousehold] Error details:", error.details)
      console.error("[onboarding:createHousehold] Error hint:", error.hint)
      console.error("[onboarding:createHousehold] Owner Clerk ID:", input.owner_clerk_user_id)

      return {
        data: null,
        error: {
          message: error.message || "Failed to create household",
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
      }
    }

    if (!data || data.length === 0) {
      console.error("[onboarding:createHousehold] ✗ Function returned no data")
      return {
        data: null,
        error: {
          message: "Household creation returned no data",
          code: "NO_DATA",
        },
      }
    }

    const result = data[0]
    console.log("[onboarding:createHousehold] ✓ Household ready:", {
      household_id: result.household_id,
      user_id: result.user_id,
      is_new: result.is_new,
    })

    // Fetch the full household record to return
    const { data: household, error: fetchError } = await supabase
      .from("starsprout_households")
      .select("*")
      .eq("id", result.household_id)
      .single()

    if (fetchError || !household) {
      console.error("[onboarding:createHousehold] ✗ Failed to fetch household record:", fetchError)
      return {
        data: null,
        error: {
          message: "Failed to fetch household after creation",
          code: fetchError?.code,
          details: fetchError?.details,
        },
      }
    }

    return { data: household, error: null }
  } catch (err: any) {
    console.error("[onboarding:createHousehold] ✗✗✗ UNEXPECTED ERROR ✗✗✗")
    console.error("[onboarding:createHousehold] Error:", err)
    console.error("[onboarding:createHousehold] Stack:", err.stack)

    return {
      data: null,
      error: {
        message: err.message || "Unexpected error during household creation",
        code: "UNEXPECTED_ERROR",
      },
    }
  }
}

// ============================================================================
// USER CREATION (USES CLERK ID → INTERNAL UUID MAPPING)
// ============================================================================

export async function createUser(
  input: CreateUserInput,
): Promise<{ data: User | null; error: SupabaseStructuredError | null }> {
  console.log("[onboarding:createUser] Called with input:", {
    clerk_user_id: input.clerk_user_id,
    role: input.role,
    nickname: input.nickname,
  })

  const supabase = getSupabaseAdmin()

  try {
    console.log("[onboarding:createUser] Calling upsert_starsprout_user function")

    const { data: userIdData, error: rpcError } = await supabase.rpc("upsert_starsprout_user", {
      p_clerk_user_id: input.clerk_user_id,
      p_household_id: input.household_id,
      p_role: input.role,
      p_nickname: input.nickname,
      p_avatar_url: input.avatar_url || null,
      p_age_band: input.age_band || null,
    })

    if (rpcError) {
      console.error("[onboarding:createUser] ✗✗✗ USER CREATION ERROR ✗✗✗")
      console.error("[onboarding:createUser] Error code:", rpcError.code)
      console.error("[onboarding:createUser] Error message:", rpcError.message)
      console.error("[onboarding:createUser] Error details:", rpcError.details)
      console.error("[onboarding:createUser] Error hint:", rpcError.hint)

      return {
        data: null,
        error: {
          message: rpcError.message || "Failed to create user",
          code: rpcError.code,
          details: rpcError.details,
          hint: rpcError.hint,
        },
      }
    }

    console.log("[onboarding:createUser] ✓ User function returned internal UUID:", userIdData)

    // Fetch the full user record
    const { data: user, error: fetchError } = await supabase
      .from("starsprout_users")
      .select("*")
      .eq("id", userIdData)
      .single()

    if (fetchError || !user) {
      console.error("[onboarding:createUser] ✗ Failed to fetch user record:", fetchError)
      return {
        data: null,
        error: {
          message: "Failed to fetch user after creation",
          code: fetchError?.code,
          details: fetchError?.details,
        },
      }
    }

    console.log("[onboarding:createUser] ✓ User created successfully:", {
      internal_id: user.id,
      clerk_id: user.clerk_user_id,
      role: user.role,
    })

    // Initialize user points record (using internal UUID)
    const { error: pointsError } = await supabase.from("starsprout_user_points").upsert(
      {
        household_id: input.household_id,
        user_id: user.id, // Internal UUID
        total_points: 0,
        available_points: 0,
        spent_points: 0,
        weekly_points: 0,
      },
      { onConflict: "user_id" },
    )

    if (pointsError) {
      console.error("[onboarding:createUser] Warning: Failed to initialize user points (non-critical):", pointsError)
    }

    // Initialize streak record if child (using internal UUID)
    if (input.role === "child") {
      const { error: streakError } = await supabase.from("starsprout_streaks").upsert(
        {
          household_id: input.household_id,
          user_id: user.id, // Internal UUID
          current_streak: 0,
          longest_streak: 0,
        },
        { onConflict: "user_id" },
      )

      if (streakError) {
        console.error("[onboarding:createUser] Warning: Failed to initialize streak (non-critical):", streakError)
      }

      // Initialize notification preferences
      await supabase.from("starsprout_notification_preferences").upsert(
        {
          user_id: user.id, // Internal UUID
          email_enabled: false,
          weekly_summary_email: false,
          in_app_enabled: true,
        },
        { onConflict: "user_id" },
      )
    } else {
      // Parent notification preferences
      await supabase.from("starsprout_notification_preferences").upsert(
        {
          user_id: user.id, // Internal UUID
          email_enabled: true,
          weekly_summary_email: true,
          in_app_enabled: true,
        },
        { onConflict: "user_id" },
      )
    }

    return { data: user, error: null }
  } catch (err: any) {
    console.error("[onboarding:createUser] ✗✗✗ UNEXPECTED ERROR ✗✗✗")
    console.error("[onboarding:createUser] Error:", err)

    return {
      data: null,
      error: {
        message: err.message || "Unexpected error during user creation",
        code: "UNEXPECTED_ERROR",
      },
    }
  }
}

// ============================================================================
// CONSENT MANAGEMENT
// ============================================================================

export async function recordConsent(input: CreateConsentInput): Promise<Consent | null> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from("starsprout_consents")
    .insert({
      household_id: input.household_id,
      parent_id: input.parent_id,
      child_id: input.child_id || null,
      consent_type: input.consent_type,
      granted: input.granted,
      granted_at: input.granted ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (error) {
    console.error("[onboarding:recordConsent] Error recording consent:", error)
    return null
  }

  return data
}

export async function recordConsents(inputs: CreateConsentInput[]): Promise<boolean> {
  const supabase = getSupabaseAdmin()

  const { error } = await supabase.from("starsprout_consents").insert(
    inputs.map((input) => ({
      household_id: input.household_id,
      parent_id: input.parent_id,
      child_id: input.child_id || null,
      consent_type: input.consent_type,
      granted: input.granted,
      granted_at: input.granted ? new Date().toISOString() : null,
    })),
  )

  if (error) {
    console.error("[onboarding:recordConsents] Error recording consents:", error)
    return false
  }

  return true
}

// ============================================================================
// INVITE CODE GENERATION (for child friend connections)
// ============================================================================

export async function generateInviteCode(input: CreateInviteCodeInput): Promise<InviteCode | null> {
  const supabase = getSupabaseAdmin()

  // Generate a short, friendly code (6 characters: 3 letters + 3 numbers)
  const code = generateFriendlyCode()

  // Set expiration to 4 hours from now
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 4)

  const { data, error } = await supabase
    .from("starsprout_invite_codes")
    .insert({
      child_id: input.child_id,
      code: code,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("[onboarding:generateInviteCode] Error generating invite code:", error)
    return null
  }

  return data
}

export async function getInviteCodeByCode(code: string): Promise<InviteCode | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("starsprout_invite_codes")
    .select("*")
    .eq("code", code.toUpperCase())
    .single()

  if (error) {
    console.error("[onboarding:getInviteCodeByCode] Error fetching invite code:", error)
    return null
  }

  return data
}

export async function invalidateInviteCode(codeId: string): Promise<boolean> {
  const supabase = await createClient()

  // Set expiration to now to invalidate
  const { error } = await supabase
    .from("starsprout_invite_codes")
    .update({ expires_at: new Date().toISOString() })
    .eq("id", codeId)

  if (error) {
    console.error("[onboarding:invalidateInviteCode] Error invalidating invite code:", error)
    return false
  }

  return true
}

// ============================================================================
// STARTER QUEST ASSIGNMENT
// ============================================================================

export async function assignStarterQuest(input: AssignTaskInput): Promise<boolean> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from("starsprout_tasks")
    .insert({
      household_id: input.household_id,
      template_id: input.template_id || null,
      assigned_to: input.assigned_to,
      assigned_by: input.assigned_by,
      title: input.title,
      description: input.description || null,
      category: input.category,
      points: input.points,
      due_date: input.due_date || null,
      status: "pending",
      streak_eligible: input.streak_eligible ?? true,
    })
    .select()
    .single()

  if (error) {
    console.error("[onboarding:assignStarterQuest] Error assigning starter quest:", error)
    return false
  }

  // Log activity
  await logActivity({
    household_id: input.household_id,
    user_id: input.assigned_by,
    event_type: "task_assigned",
    entity_type: "task",
    entity_id: data.id,
    metadata: { child_id: input.assigned_to },
  })

  return true
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

export async function getHouseholdById(householdId: string): Promise<Household | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("starsprout_households").select("*").eq("id", householdId).single()

  if (error) {
    console.error("[onboarding:getHouseholdById] Error fetching household:", error)
    return null
  }

  return data
}

export async function getUserById(userId: string): Promise<User | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("starsprout_users").select("*").eq("id", userId).single()

  if (error) {
    console.error("[onboarding:getUserById] Error fetching user:", error)
    return null
  }

  return data
}

export async function getHouseholdChildren(householdId: string): Promise<User[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("starsprout_users")
    .select("*")
    .eq("household_id", householdId)
    .eq("role", "child")
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[onboarding:getHouseholdChildren] Error fetching children:", error)
    return []
  }

  return data || []
}

// ============================================================================
// HELPERS
// ============================================================================

function generateFriendlyCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ" // Exclude I, O for clarity
  const numbers = "23456789" // Exclude 0, 1 for clarity

  let code = ""

  // 3 letters
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length))
  }

  // 3 numbers
  for (let i = 0; i < 3; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length))
  }

  return code
}
