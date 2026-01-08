import { auth, currentUser } from "@clerk/nextjs/server"

export interface AdminUser {
  id: string
  email: string
  name: string
  imageUrl?: string
}

/**
 * Check if a user is an admin based on:
 * 1. Clerk privateMetadata.role === 'admin'
 * 2. Email is in ADMIN_EMAIL_ALLOWLIST
 */
export async function isAdminUser(): Promise<boolean> {
  const user = await currentUser()
  if (!user) return false

  // Check Clerk role
  const privateMetadata = user.privateMetadata as { role?: string }
  const hasAdminRole = privateMetadata.role === "admin"

  // Check email allowlist
  const allowlist = process.env.ADMIN_EMAIL_ALLOWLIST?.split(",").map((e) => e.trim().toLowerCase()) || []
  const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase()
  const isInAllowlist = userEmail && allowlist.includes(userEmail)

  return hasAdminRole && isInAllowlist
}

/**
 * Get admin identity - throws if user is not admin
 */
export async function requireAdmin(): Promise<AdminUser> {
  const { userId } = await auth()
  if (!userId) {
    throw new Error("Authentication required")
  }

  const user = await currentUser()
  if (!user) {
    throw new Error("User not found")
  }

  const isAdmin = await isAdminUser()
  if (!isAdmin) {
    throw new Error("Admin access required")
  }

  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress || "",
    name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || "Admin",
    imageUrl: user.imageUrl,
  }
}

/**
 * Get admin identity without throwing - returns null if not admin
 */
export async function getAdminIdentity(): Promise<AdminUser | null> {
  try {
    return await requireAdmin()
  } catch {
    return null
  }
}
