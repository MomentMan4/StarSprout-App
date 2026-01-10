import { supabaseAdmin } from "@/lib/db/supabaseAdmin"

export interface UserProfile {
  id: string
  clerk_user_id: string
  household_id: string
  role: "parent" | "child"
  nickname: string
  avatar_url?: string | null
  age_band?: string | null
  setup_complete: boolean
}

async function fetchProfileInternal(clerkUserId: string): Promise<UserProfile | null> {
  console.log("[profile:fetch] Fetching profile for clerk_user_id:", clerkUserId)

  const { data, error } = await supabaseAdmin
    .from("starsprout_users")
    .select("id, clerk_user_id, household_id, role, nickname, avatar_url, age_band")
    .eq("clerk_user_id", clerkUserId)
    .single()

  if (error) {
    console.error("[profile:fetch] Error fetching profile:", {
      code: error.code,
      message: error.message,
      details: error.details,
    })
    return null
  }

  if (!data) {
    console.log("[profile:fetch] No profile found")
    return null
  }

  console.log("[profile:fetch] Profile found:", {
    internal_id: data.id,
    clerk_id: data.clerk_user_id,
    role: data.role,
    household_id: data.household_id,
  })

  return {
    ...data,
    setup_complete: !!(data.household_id && data.role),
  }
}

export async function fetchUserProfile(clerkUserId: string, maxRetries = 3): Promise<UserProfile | null> {
  const delays = [250, 500, 1000]

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    console.log(`[profile:fetch] Attempt ${attempt + 1}/${maxRetries}`)

    const profile = await fetchProfileInternal(clerkUserId)

    if (profile) {
      console.log(`[profile:fetch] Success on attempt ${attempt + 1}`)
      return profile
    }

    // Don't delay after last attempt
    if (attempt < maxRetries - 1) {
      const delay = delays[attempt] || 1000
      console.log(`[profile:fetch] Retry in ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  console.error(`[profile:fetch] Failed after ${maxRetries} attempts`)
  return null
}

export async function checkOnboardingComplete(clerkUserId: string): Promise<boolean> {
  console.log("[profile:checkOnboardingComplete] Checking for clerk_user_id:", clerkUserId)

  const profile = await fetchUserProfile(clerkUserId, 2) // Quick check with 2 retries

  if (!profile) {
    console.log("[profile:checkOnboardingComplete] No profile found - onboarding incomplete")
    return false
  }

  const isComplete = !!(profile.household_id && profile.role)
  console.log("[profile:checkOnboardingComplete] Onboarding complete:", isComplete)

  return isComplete
}
