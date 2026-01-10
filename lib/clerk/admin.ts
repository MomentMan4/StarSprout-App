// Clerk Admin Utilities - Manage user roles via Clerk server SDK
import { clerkClient } from "@clerk/nextjs/server"

export interface ClerkUserMetadata {
  role?: "admin" | "user"
}

/**
 * Get a Clerk user by email
 */
export async function getClerkUserByEmail(email: string) {
  try {
    const client = await clerkClient()
    const users = await client.users.getUserList({ emailAddress: [email] })
    return users.data[0] || null
  } catch (error) {
    console.error("[v0] Failed to get Clerk user by email:", error)
    return null
  }
}

/**
 * Get a Clerk user by ID
 */
export async function getClerkUserById(userId: string) {
  try {
    const client = await clerkClient()
    return await client.users.getUser(userId)
  } catch (error) {
    console.error("[v0] Failed to get Clerk user by ID:", error)
    return null
  }
}

/**
 * Promote a user to admin by updating Clerk privateMetadata
 */
export async function promoteUserToAdmin(userId: string): Promise<boolean> {
  try {
    const client = await clerkClient()
    await client.users.updateUser(userId, {
      privateMetadata: { role: "admin" },
    })
    console.log(`[v0] Promoted user ${userId} to admin`)
    return true
  } catch (error) {
    console.error("[v0] Failed to promote user to admin:", error)
    return false
  }
}

/**
 * Demote an admin user to regular user
 */
export async function demoteAdminToUser(userId: string): Promise<boolean> {
  try {
    const client = await clerkClient()
    await client.users.updateUser(userId, {
      privateMetadata: { role: "user" },
    })
    console.log(`[v0] Demoted admin ${userId} to user`)
    return true
  } catch (error) {
    console.error("[v0] Failed to demote admin to user:", error)
    return false
  }
}

/**
 * Get all admin users from Clerk
 */
export async function getAllAdminUsers() {
  try {
    const client = await clerkClient()
    // Clerk doesn't support filtering by privateMetadata, so we need to fetch and filter
    // In production, consider maintaining a separate admin users table for performance
    const users = await client.users.getUserList({ limit: 500 })

    return users.data.filter((user) => {
      const metadata = user.privateMetadata as ClerkUserMetadata
      return metadata.role === "admin"
    })
  } catch (error) {
    console.error("[v0] Failed to get admin users from Clerk:", error)
    return []
  }
}
