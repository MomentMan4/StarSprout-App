"use server"

import { requireAdmin, getAdminIdentity } from "@/lib/adminAuth"
import { createClient } from "@/lib/supabase/server"
import { writeAuditLog } from "@/lib/db/repositories/adminAudit"
import { revalidatePath } from "next/cache"

// ============================================================================
// UPDATE USER NICKNAME
// ============================================================================

export async function updateUserNicknameAction(userId: string, newNickname: string) {
  try {
    await requireAdmin()
    const adminIdentity = await getAdminIdentity()
    const supabase = await createClient()

    // Get current user data
    const { data: currentUser } = await supabase.from("starsprout_users").select("*").eq("id", userId).single()

    if (!currentUser) {
      return { success: false, error: "User not found" }
    }

    // Determine field based on role
    const fieldToUpdate = currentUser.role === "child" ? "nickname" : "display_name"

    // Update nickname
    const { error } = await supabase
      .from("starsprout_users")
      .update({ [fieldToUpdate]: newNickname, updated_at: new Date().toISOString() })
      .eq("id", userId)

    if (error) {
      return { success: false, error: error.message }
    }

    // Write audit log
    await writeAuditLog({
      actor_admin_user_id: adminIdentity.userId,
      actor_email: adminIdentity.email,
      action_type: "UPDATE_USER_NICKNAME",
      entity_type: "user",
      entity_id: userId,
      before_json: { [fieldToUpdate]: currentUser[fieldToUpdate] },
      after_json: { [fieldToUpdate]: newNickname },
    })

    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Admin action error:", error)
    return { success: false, error: "Internal server error" }
  }
}

// ============================================================================
// UPDATE AGE BAND
// ============================================================================

export async function updateUserAgeBandAction(userId: string, newAgeBand: string) {
  try {
    await requireAdmin()
    const adminIdentity = await getAdminIdentity()
    const supabase = await createClient()

    const { data: currentUser } = await supabase.from("starsprout_users").select("*").eq("id", userId).single()

    if (!currentUser || currentUser.role !== "child") {
      return { success: false, error: "Child user not found" }
    }

    const { error } = await supabase
      .from("starsprout_users")
      .update({ age_band: newAgeBand, updated_at: new Date().toISOString() })
      .eq("id", userId)

    if (error) {
      return { success: false, error: error.message }
    }

    await writeAuditLog({
      actor_admin_user_id: adminIdentity.userId,
      actor_email: adminIdentity.email,
      action_type: "UPDATE_USER_AGE_BAND",
      entity_type: "user",
      entity_id: userId,
      before_json: { age_band: currentUser.age_band },
      after_json: { age_band: newAgeBand },
    })

    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Admin action error:", error)
    return { success: false, error: "Internal server error" }
  }
}

// ============================================================================
// RESET AVATAR
// ============================================================================

export async function resetUserAvatarAction(userId: string) {
  try {
    await requireAdmin()
    const adminIdentity = await getAdminIdentity()
    const supabase = await createClient()

    const { data: currentUser } = await supabase.from("starsprout_users").select("*").eq("id", userId).single()

    if (!currentUser) {
      return { success: false, error: "User not found" }
    }

    const { error } = await supabase
      .from("starsprout_users")
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq("id", userId)

    if (error) {
      return { success: false, error: error.message }
    }

    await writeAuditLog({
      actor_admin_user_id: adminIdentity.userId,
      actor_email: adminIdentity.email,
      action_type: "RESET_USER_AVATAR",
      entity_type: "user",
      entity_id: userId,
      before_json: { avatar_url: currentUser.avatar_url },
      after_json: { avatar_url: null },
    })

    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Admin action error:", error)
    return { success: false, error: "Internal server error" }
  }
}

// ============================================================================
// UPDATE USER STATUS
// ============================================================================

export async function updateUserStatusAction(userId: string, newStatus: string) {
  try {
    await requireAdmin()
    const adminIdentity = await getAdminIdentity()
    const supabase = await createClient()

    const { data: currentUser } = await supabase.from("starsprout_users").select("*").eq("id", userId).single()

    if (!currentUser) {
      return { success: false, error: "User not found" }
    }

    const { error } = await supabase
      .from("starsprout_users")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", userId)

    if (error) {
      return { success: false, error: error.message }
    }

    await writeAuditLog({
      actor_admin_user_id: adminIdentity.userId,
      actor_email: adminIdentity.email,
      action_type: newStatus === "active" ? "ENABLE_USER" : "DISABLE_USER",
      entity_type: "user",
      entity_id: userId,
      before_json: { status: currentUser.status || "active" },
      after_json: { status: newStatus },
    })

    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Admin action error:", error)
    return { success: false, error: "Internal server error" }
  }
}

// ============================================================================
// RELINK CHILD TO HOUSEHOLD
// ============================================================================

export async function relinkChildToHouseholdAction(userId: string, newHouseholdId: string) {
  try {
    await requireAdmin()
    const adminIdentity = await getAdminIdentity()
    const supabase = await createClient()

    const { data: currentUser } = await supabase.from("starsprout_users").select("*").eq("id", userId).single()

    if (!currentUser || currentUser.role !== "child") {
      return { success: false, error: "Child user not found" }
    }

    // Verify new household exists
    const { data: newHousehold } = await supabase
      .from("starsprout_households")
      .select("id")
      .eq("id", newHouseholdId)
      .single()

    if (!newHousehold) {
      return { success: false, error: "Target household not found" }
    }

    const { error } = await supabase
      .from("starsprout_users")
      .update({ household_id: newHouseholdId, updated_at: new Date().toISOString() })
      .eq("id", userId)

    if (error) {
      return { success: false, error: error.message }
    }

    await writeAuditLog({
      actor_admin_user_id: adminIdentity.userId,
      actor_email: adminIdentity.email,
      action_type: "RELINK_CHILD_HOUSEHOLD",
      entity_type: "user",
      entity_id: userId,
      before_json: { household_id: currentUser.household_id },
      after_json: { household_id: newHouseholdId },
      metadata: { warning: "Critical operation - child moved between households" },
    })

    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Admin action error:", error)
    return { success: false, error: "Internal server error" }
  }
}
