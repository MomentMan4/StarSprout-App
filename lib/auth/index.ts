import { auth, currentUser } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"

export type UserRole = "parent" | "child"
export type AgeBand = "early_child" | "mid_child" | "pre_teen" | "teen"

export interface StarSproutUser {
  clerkUserId: string
  householdId: string
  role: UserRole
  displayName: string
  avatarUrl?: string | null
  ageBand?: AgeBand | null
  email?: string
  setupComplete: boolean
}

/**
 * Get the current authenticated user with StarSprout metadata from Clerk
 * Returns null if not authenticated or setup incomplete
 */
export async function getCurrentUser(): Promise<StarSproutUser | null> {
  const { userId } = await auth()
  if (!userId) return null

  const user = await currentUser()
  if (!user) return null

  const metadata = user.publicMetadata as {
    role?: UserRole
    household_id?: string
    age_band?: AgeBand
    setup_complete?: boolean
  }

  // Return null if required metadata is missing
  if (!metadata.role || !metadata.household_id || !metadata.setup_complete) {
    return null
  }

  return {
    clerkUserId: user.id,
    householdId: metadata.household_id,
    role: metadata.role,
    displayName: user.firstName || user.username || "User",
    avatarUrl: user.imageUrl,
    ageBand: metadata.age_band || null,
    email: user.emailAddresses[0]?.emailAddress,
    setupComplete: metadata.setup_complete,
  }
}

/**
 * Require authentication - throws if not authenticated or setup incomplete
 */
export async function requireAuth(): Promise<StarSproutUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Authentication required. Please sign in and complete onboarding.")
  }
  return user
}

/**
 * Require specific role - throws if user doesn't have the required role
 */
export async function requireRole(role: UserRole): Promise<StarSproutUser> {
  const user = await requireAuth()
  if (user.role !== role) {
    throw new Error(`This page requires ${role} access. You are signed in as ${user.role}.`)
  }
  return user
}

/**
 * Require parent role
 */
export async function requireParent(): Promise<StarSproutUser> {
  return requireRole("parent")
}

/**
 * Require child role
 */
export async function requireChild(): Promise<StarSproutUser> {
  return requireRole("child")
}

/**
 * Get age band label for display
 */
export function getAgeBandLabel(ageBand: AgeBand): string {
  const labels: Record<AgeBand, string> = {
    early_child: "5-7 years",
    mid_child: "8-10 years",
    pre_teen: "11-13 years",
    teen: "14-16 years",
  }
  return labels[ageBand]
}

/**
 * Sync Clerk user to Supabase database
 * Called during onboarding to create user record
 */
export async function syncUserToDatabase(
  clerkUserId: string,
  householdId: string,
  role: UserRole,
  nickname: string,
  ageBand?: AgeBand,
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from("starsprout_users").upsert(
    {
      id: clerkUserId,
      household_id: householdId,
      role,
      nickname,
      age_band: ageBand || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "id",
    },
  )

  if (error) {
    console.error("[v0] Error syncing user to database:", error)
    throw new Error("Failed to sync user to database")
  }
}
