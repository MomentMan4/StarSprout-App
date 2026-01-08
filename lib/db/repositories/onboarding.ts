// Onboarding Repository - Handles household setup and user creation

import { createClient } from "@/lib/supabase/server"
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

// ============================================================================
// HOUSEHOLD CREATION
// ============================================================================

export async function createHousehold(input: CreateHouseholdInput): Promise<Household | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("starsprout_households")
    .insert({
      name: input.name,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating household:", error)
    return null
  }

  return data
}

// ============================================================================
// USER CREATION
// ============================================================================

export async function createUser(input: CreateUserInput): Promise<User | null> {
  const supabase = await createClient()

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
    console.error("[v0] Error creating user:", error)
    return null
  }

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

  return data
}

// ============================================================================
// CONSENT MANAGEMENT
// ============================================================================

export async function recordConsent(input: CreateConsentInput): Promise<Consent | null> {
  const supabase = await createClient()

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
    console.error("[v0] Error recording consent:", error)
    return null
  }

  return data
}

export async function recordConsents(inputs: CreateConsentInput[]): Promise<boolean> {
  const supabase = await createClient()

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
    console.error("[v0] Error recording consents:", error)
    return false
  }

  return true
}

// ============================================================================
// INVITE CODE GENERATION (for child friend connections)
// ============================================================================

export async function generateInviteCode(input: CreateInviteCodeInput): Promise<InviteCode | null> {
  const supabase = await createClient()

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
    console.error("[v0] Error generating invite code:", error)
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
    console.error("[v0] Error fetching invite code:", error)
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
    console.error("[v0] Error invalidating invite code:", error)
    return false
  }

  return true
}

// ============================================================================
// STARTER QUEST ASSIGNMENT
// ============================================================================

export async function assignStarterQuest(input: AssignTaskInput): Promise<boolean> {
  const supabase = await createClient()

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
    console.error("[v0] Error assigning starter quest:", error)
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

// ============================================================================
// QUERY HELPERS
// ============================================================================

export async function getHouseholdById(householdId: string): Promise<Household | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("starsprout_households").select("*").eq("id", householdId).single()

  if (error) {
    console.error("[v0] Error fetching household:", error)
    return null
  }

  return data
}

export async function getUserById(userId: string): Promise<User | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("starsprout_users").select("*").eq("id", userId).single()

  if (error) {
    console.error("[v0] Error fetching user:", error)
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
    console.error("[v0] Error fetching children:", error)
    return []
  }

  return data || []
}
