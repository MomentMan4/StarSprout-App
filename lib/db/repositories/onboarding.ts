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
// HOUSEHOLD CREATION
// ============================================================================

export async function createHousehold(
  input: CreateHouseholdInput & { owner_clerk_user_id: string },
): Promise<{ data: Household | null; error: SupabaseStructuredError | null }> {
  console.log("[onboarding:createHousehold] Called with input:", JSON.stringify(input))

  const supabase = getSupabaseAdmin()

  try {
    console.log("[onboarding:createHousehold] Checking for existing household owned by:", input.owner_clerk_user_id)

    const { data: existingHouseholds, error: fetchError } = await supabase
      .from("starsprout_households")
      .select("*, starsprout_users!inner(id, role)")
      .eq("starsprout_users.id", input.owner_clerk_user_id)
      .eq("starsprout_users.role", "parent")
      .limit(1)

    if (fetchError) {
      console.error("[onboarding:createHousehold] Error checking existing household:", {
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
      })
    } else if (existingHouseholds && existingHouseholds.length > 0) {
      console.log("[onboarding:createHousehold] ✓ Found existing household (idempotent):", existingHouseholds[0].id)
      return { data: existingHouseholds[0] as Household, error: null }
    }

    console.log("[onboarding:createHousehold] Creating new household:", input.name)

    const { data, error } = await supabase
      .from("starsprout_households")
      .insert({
        name: input.name,
      })
      .select()
      .single()

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

    console.log("[onboarding:createHousehold] ✓ Household created successfully:", data.id)
    return { data, error: null }
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
// USER CREATION
// ============================================================================

export async function createUser(
  input: CreateUserInput,
): Promise<{ data: User | null; error: SupabaseStructuredError | null }> {
  console.log(
    "[onboarding:createUser] Called with input:",
    JSON.stringify({ ...input, id: `${input.id.substring(0, 10)}...` }),
  )

  const supabase = getSupabaseAdmin()

  try {
    const { data: existingUser } = await supabase.from("starsprout_users").select("*").eq("id", input.id).single()

    if (existingUser) {
      console.log("[onboarding:createUser] ✓ User already exists (idempotent):", existingUser.id)
      return { data: existingUser, error: null }
    }

    const { data, error } = await supabase
      .from("starsprout_users")
      .insert({
        id: input.id,
        household_id: input.household_id,
        role: input.role,
        nickname: input.nickname,
        avatar_url: input.avatar_url || null,
        age_band: input.age_band || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[onboarding:createUser] ✗✗✗ USER CREATION ERROR ✗✗✗")
      console.error("[onboarding:createUser] Error code:", error.code)
      console.error("[onboarding:createUser] Error message:", error.message)
      console.error("[onboarding:createUser] Error details:", error.details)
      console.error("[onboarding:createUser] Error hint:", error.hint)

      return {
        data: null,
        error: {
          message: error.message || "Failed to create user",
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
      }
    }

    console.log("[onboarding:createUser] ✓ User created successfully:", data.id)

    // Initialize user points record
    await supabase.from("starsprout_user_points").insert({
      household_id: input.household_id,
      user_id: input.id,
      total_points: 0,
      available_points: 0,
      spent_points: 0,
      weekly_points: 0,
    })

    // Initialize streak record if child
    if (input.role === "child") {
      await supabase.from("starsprout_streaks").insert({
        household_id: input.household_id,
        user_id: input.id,
        current_streak: 0,
        longest_streak: 0,
      })

      // Initialize notification preferences
      await supabase.from("starsprout_notification_preferences").insert({
        user_id: input.id,
        email_enabled: false,
        weekly_summary_email: false,
        in_app_enabled: true,
      })
    } else {
      // Parent notification preferences
      await supabase.from("starsprout_notification_preferences").insert({
        user_id: input.id,
        email_enabled: true,
        weekly_summary_email: true,
        in_app_enabled: true,
      })
    }

    return { data, error: null }
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
