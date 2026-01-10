// Admin Bootstrap Logic - Handle first admin setup
import { getAllAdminUsers } from "./clerk/admin"

/**
 * Check if bootstrap is allowed
 * Bootstrap is only allowed when:
 * 1. There are ZERO admins in the system
 * 2. The requestor's email is in the ADMIN_EMAIL_ALLOWLIST
 */
export async function isBootstrapAllowed(requestorEmail: string): Promise<boolean> {
  // Check if email is in allowlist
  const allowlist = getAdminAllowlist()
  if (!allowlist.includes(requestorEmail.toLowerCase())) {
    console.log(`[v0] Bootstrap denied: ${requestorEmail} not in allowlist`)
    return false
  }

  // Check if any admins exist
  const adminCount = await countAdmins()
  if (adminCount > 0) {
    console.log(`[v0] Bootstrap denied: ${adminCount} admins already exist`)
    return false
  }

  console.log(`[v0] Bootstrap allowed for ${requestorEmail}`)
  return true
}

/**
 * Count the number of admins in the system
 */
export async function countAdmins(): Promise<number> {
  const admins = await getAllAdminUsers()
  return admins.length
}

/**
 * Get the admin email allowlist from environment variable
 */
export function getAdminAllowlist(): string[] {
  const allowlistEnv = process.env.ADMIN_EMAIL_ALLOWLIST || ""
  return allowlistEnv
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0)
}

/**
 * Check if an email is in the admin allowlist
 */
export function isEmailAllowlisted(email: string): boolean {
  const allowlist = getAdminAllowlist()
  return allowlist.includes(email.toLowerCase())
}
