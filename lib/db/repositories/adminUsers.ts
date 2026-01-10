// Admin Users Repository - Manage admin user promotion/demotion
import {
  getClerkUserByEmail,
  getClerkUserById,
  promoteUserToAdmin,
  demoteAdminToUser,
  getAllAdminUsers,
} from "@/lib/clerk/admin"
import { writeAuditLog } from "./adminAudit"
import { isBootstrapAllowed, countAdmins as countAdminsFromBootstrap, isEmailAllowlisted } from "@/lib/adminBootstrap"
import type { AdminUser } from "@/lib/adminAuth"

export interface AdminUserInfo {
  userId: string
  email: string
  name: string
  imageUrl?: string
  createdAt: string
}

// ============================================================================
// LIST ADMINS
// ============================================================================

/**
 * List all admin users in the system
 */
export async function listAdmins(): Promise<AdminUserInfo[]> {
  const adminUsers = await getAllAdminUsers()

  return adminUsers.map((user) => ({
    userId: user.id,
    email: user.emailAddresses[0]?.emailAddress || "",
    name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || "Admin",
    imageUrl: user.imageUrl,
    createdAt: new Date(user.createdAt).toISOString(),
  }))
}

/**
 * Count the number of admins in the system
 */
export const countAdmins = countAdminsFromBootstrap

// ============================================================================
// PROMOTE ADMIN
// ============================================================================

export interface PromoteAdminInput {
  targetEmail?: string
  targetUserId?: string
  actorAdmin: AdminUser
  isBootstrap?: boolean
}

export interface PromoteAdminResult {
  success: boolean
  error?: string
  userId?: string
}

/**
 * Promote a user to admin
 * Handles both bootstrap and regular promotion flows
 */
export async function promoteAdmin(input: PromoteAdminInput): Promise<PromoteAdminResult> {
  const { targetEmail, targetUserId, actorAdmin, isBootstrap = false } = input

  // Validate input - must provide either email or userId
  if (!targetEmail && !targetUserId) {
    return { success: false, error: "Must provide either targetEmail or targetUserId" }
  }

  // Get target user from Clerk
  let targetUser = null
  if (targetUserId) {
    targetUser = await getClerkUserById(targetUserId)
  } else if (targetEmail) {
    targetUser = await getClerkUserByEmail(targetEmail)
  }

  if (!targetUser) {
    return { success: false, error: "User not found in Clerk" }
  }

  const targetUserEmail = targetUser.emailAddresses[0]?.emailAddress

  // Bootstrap flow - check if bootstrap is allowed
  if (isBootstrap) {
    const bootstrapAllowed = await isBootstrapAllowed(targetUserEmail || "")
    if (!bootstrapAllowed) {
      return {
        success: false,
        error: "Bootstrap not allowed. Either admins already exist or email not in allowlist.",
      }
    }
  } else {
    // Regular promotion - check allowlist
    if (!isEmailAllowlisted(targetUserEmail || "")) {
      return {
        success: false,
        error: "User email is not in ADMIN_EMAIL_ALLOWLIST. Cannot promote.",
      }
    }
  }

  // Check if user is already an admin
  const metadata = targetUser.privateMetadata as { role?: string }
  if (metadata.role === "admin") {
    return { success: false, error: "User is already an admin" }
  }

  // Promote user in Clerk
  const promoted = await promoteUserToAdmin(targetUser.id)
  if (!promoted) {
    return { success: false, error: "Failed to update user role in Clerk" }
  }

  // Write audit log
  await writeAuditLog({
    actor_admin_user_id: actorAdmin.id,
    actor_email: actorAdmin.email,
    action_type: "PROMOTE_ADMIN",
    entity_type: "user",
    entity_id: targetUser.id,
    before_json: { role: metadata.role || "user" },
    after_json: { role: "admin" },
    metadata: {
      target_email: targetUserEmail,
      is_bootstrap: isBootstrap,
    },
  })

  console.log(`[v0] User ${targetUser.id} promoted to admin by ${actorAdmin.email}`)
  return { success: true, userId: targetUser.id }
}

// ============================================================================
// DEMOTE ADMIN
// ============================================================================

export interface DemoteAdminInput {
  targetEmail?: string
  targetUserId?: string
  actorAdmin: AdminUser
}

export interface DemoteAdminResult {
  success: boolean
  error?: string
  userId?: string
}

/**
 * Demote an admin to regular user
 * Prevents demoting the last admin (safety rule)
 */
export async function demoteAdmin(input: DemoteAdminInput): Promise<DemoteAdminResult> {
  const { targetEmail, targetUserId, actorAdmin } = input

  // Validate input
  if (!targetEmail && !targetUserId) {
    return { success: false, error: "Must provide either targetEmail or targetUserId" }
  }

  // Get target user from Clerk
  let targetUser = null
  if (targetUserId) {
    targetUser = await getClerkUserById(targetUserId)
  } else if (targetEmail) {
    targetUser = await getClerkUserByEmail(targetEmail)
  }

  if (!targetUser) {
    return { success: false, error: "User not found in Clerk" }
  }

  // Check if user is an admin
  const metadata = targetUser.privateMetadata as { role?: string }
  if (metadata.role !== "admin") {
    return { success: false, error: "User is not an admin" }
  }

  // Safety check: prevent demoting the last admin
  const adminCount = await countAdmins()
  if (adminCount <= 1) {
    return {
      success: false,
      error: "Cannot demote the last remaining admin. Promote another admin first.",
    }
  }

  // Demote user in Clerk
  const demoted = await demoteAdminToUser(targetUser.id)
  if (!demoted) {
    return { success: false, error: "Failed to update user role in Clerk" }
  }

  const targetUserEmail = targetUser.emailAddresses[0]?.emailAddress

  // Write audit log
  await writeAuditLog({
    actor_admin_user_id: actorAdmin.id,
    actor_email: actorAdmin.email,
    action_type: "DEMOTE_ADMIN",
    entity_type: "user",
    entity_id: targetUser.id,
    before_json: { role: "admin" },
    after_json: { role: "user" },
    metadata: { target_email: targetUserEmail },
  })

  console.log(`[v0] Admin ${targetUser.id} demoted to user by ${actorAdmin.email}`)
  return { success: true, userId: targetUser.id }
}
