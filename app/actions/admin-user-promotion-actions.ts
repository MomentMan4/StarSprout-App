"use server"

import { requireAdmin } from "@/lib/adminAuth"
import { listAdmins, promoteAdmin, demoteAdmin } from "@/lib/db/repositories/adminUsers"
import { isBootstrapAllowed, countAdmins } from "@/lib/adminBootstrap"
import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

// ============================================================================
// LIST ADMIN USERS
// ============================================================================

export async function listAdminUsersAction() {
  try {
    await requireAdmin()
    const admins = await listAdmins()
    const adminCount = await countAdmins()

    return {
      success: true,
      admins,
      totalCount: adminCount,
    }
  } catch (error: any) {
    console.error("[v0] List admins error:", error)
    return {
      success: false,
      error: error.message || "Failed to list admins",
      admins: [],
      totalCount: 0,
    }
  }
}

// ============================================================================
// PROMOTE ADMIN
// ============================================================================

export async function promoteAdminAction(targetEmail: string) {
  try {
    const admin = await requireAdmin()

    const result = await promoteAdmin({
      targetEmail,
      actorAdmin: admin,
      isBootstrap: false,
    })

    if (result.success) {
      revalidatePath("/admin/admin-users")
    }

    return result
  } catch (error: any) {
    console.error("[v0] Promote admin error:", error)
    return {
      success: false,
      error: error.message || "Failed to promote admin",
    }
  }
}

// ============================================================================
// DEMOTE ADMIN
// ============================================================================

export async function demoteAdminAction(targetEmail: string) {
  try {
    const admin = await requireAdmin()

    const result = await demoteAdmin({
      targetEmail,
      actorAdmin: admin,
    })

    if (result.success) {
      revalidatePath("/admin/admin-users")
    }

    return result
  } catch (error: any) {
    console.error("[v0] Demote admin error:", error)
    return {
      success: false,
      error: error.message || "Failed to demote admin",
    }
  }
}

// ============================================================================
// BOOTSTRAP CHECK
// ============================================================================

export async function checkBootstrapEligibilityAction() {
  try {
    const user = await currentUser()
    if (!user) {
      return { eligible: false, reason: "Not authenticated" }
    }

    const userEmail = user.emailAddresses[0]?.emailAddress
    if (!userEmail) {
      return { eligible: false, reason: "No email found" }
    }

    const eligible = await isBootstrapAllowed(userEmail)
    if (!eligible) {
      const adminCount = await countAdmins()
      const reason =
        adminCount > 0
          ? "Admins already exist in the system"
          : "Your email is not in the admin allowlist (ADMIN_EMAIL_ALLOWLIST)"

      return { eligible: false, reason }
    }

    return { eligible: true, userEmail }
  } catch (error: any) {
    console.error("[v0] Bootstrap check error:", error)
    return { eligible: false, reason: "Error checking eligibility" }
  }
}

// ============================================================================
// BOOTSTRAP SELF-PROMOTION
// ============================================================================

export async function bootstrapSelfPromotionAction() {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const userEmail = user.emailAddresses[0]?.emailAddress
    if (!userEmail) {
      return { success: false, error: "No email found" }
    }

    // Check if bootstrap is allowed
    const eligible = await isBootstrapAllowed(userEmail)
    if (!eligible) {
      return { success: false, error: "Bootstrap not allowed" }
    }

    // Promote self
    const result = await promoteAdmin({
      targetEmail: userEmail,
      actorAdmin: {
        id: user.id,
        email: userEmail,
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "Bootstrap Admin",
      },
      isBootstrap: true,
    })

    if (result.success) {
      revalidatePath("/admin")
      revalidatePath("/admin/admin-users")
    }

    return result
  } catch (error: any) {
    console.error("[v0] Bootstrap self-promotion error:", error)
    return {
      success: false,
      error: error.message || "Failed to bootstrap admin",
    }
  }
}
