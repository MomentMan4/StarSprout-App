"use server"

import { requireAdmin, getAdminIdentity } from "@/lib/adminAuth"
import { createClient } from "@/lib/supabase/server"
import { logAdminAction } from "@/lib/db/repositories/admin"
import { rateLimit } from "@/lib/rate-limit"

// ============================================================================
// REGENERATE INVITE CODE
// ============================================================================

export async function regenerateInviteCodeAction(childId: string) {
  try {
    const admin = await requireAdmin()
    const adminIdentity = await getAdminIdentity()
    const supabase = await createClient()

    // Get child details
    const { data: child } = await supabase.from("starsprout_users").select("*").eq("id", childId).single()

    if (!child) {
      return { success: false, error: "Child not found" }
    }

    // Get old invite code
    const { data: oldCode } = await supabase
      .from("starsprout_invite_codes")
      .select("*")
      .eq("child_id", childId)
      .single()

    // Generate new code
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 4)

    // Delete old code and insert new
    await supabase.from("starsprout_invite_codes").delete().eq("child_id", childId)

    const { error } = await supabase.from("starsprout_invite_codes").insert({
      child_id: childId,
      code: newCode,
      expires_at: expiresAt.toISOString(),
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // Log admin action
    await logAdminAction({
      admin_user_id: admin.userId,
      admin_email: adminIdentity.email,
      action: "regenerate_invite_code",
      target_type: "child",
      target_id: childId,
      before_state: { old_code: oldCode?.code },
      after_state: { new_code: newCode },
    })

    return { success: true }
  } catch (error) {
    console.error("[v0] Admin action error:", error)
    return { success: false, error: "Internal server error" }
  }
}

// ============================================================================
// TRIGGER BACKGROUND JOBS
// ============================================================================

export async function triggerJobAction(householdId: string, jobType: "leaderboard" | "streaks" | "weekly_summary") {
  try {
    const admin = await requireAdmin()
    const adminIdentity = await getAdminIdentity()

    // Rate limit: 5 job triggers per hour per household
    const rateLimitKey = `admin_job_${householdId}`
    const { success: rateLimitOk } = await rateLimit(rateLimitKey, 5, 3600)

    if (!rateLimitOk) {
      return { success: false, error: "Rate limit exceeded. Try again later." }
    }

    // TODO: Implement actual job triggers based on jobType
    // For now, just log the action

    await logAdminAction({
      admin_user_id: admin.userId,
      admin_email: adminIdentity.email,
      action: `trigger_job_${jobType}`,
      target_type: "household",
      target_id: householdId,
      metadata: { job_type: jobType },
    })

    return { success: true }
  } catch (error) {
    console.error("[v0] Admin action error:", error)
    return { success: false, error: "Internal server error" }
  }
}
