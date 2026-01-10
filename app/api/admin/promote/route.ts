import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { promoteAdmin } from "@/lib/db/repositories/adminUsers"
import { isBootstrapAllowed } from "@/lib/adminBootstrap"
import { currentUser } from "@clerk/nextjs/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] POST /api/admin/promote - Starting")

    // Get request body
    const body = await request.json()
    const { targetEmail, targetUserId, isBootstrap } = body

    console.log("[v0] Promote request:", { targetEmail, targetUserId, isBootstrap })

    // Validate input
    if (!targetEmail && !targetUserId) {
      return NextResponse.json({ success: false, error: "Must provide targetEmail or targetUserId" }, { status: 400 })
    }

    // Handle bootstrap flow
    if (isBootstrap) {
      const user = await currentUser()
      if (!user) {
        return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
      }

      const userEmail = user.emailAddresses[0]?.emailAddress
      if (!userEmail) {
        return NextResponse.json({ success: false, error: "User email not found" }, { status: 400 })
      }

      // Check if bootstrap is allowed
      const bootstrapAllowed = await isBootstrapAllowed(userEmail)
      if (!bootstrapAllowed) {
        return NextResponse.json(
          {
            success: false,
            error: "Bootstrap not allowed. Either admins already exist or your email is not in the allowlist.",
          },
          { status: 403 },
        )
      }

      // For bootstrap, promote the requestor themselves
      const result = await promoteAdmin({
        targetEmail: userEmail,
        actorAdmin: {
          id: user.id,
          email: userEmail,
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "Bootstrap Admin",
        },
        isBootstrap: true,
      })

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 })
      }

      return NextResponse.json({ success: true, userId: result.userId })
    }

    // Regular promotion flow - require admin
    const admin = await requireAdmin()

    const result = await promoteAdmin({
      targetEmail,
      targetUserId,
      actorAdmin: admin,
      isBootstrap: false,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, userId: result.userId })
  } catch (error: any) {
    console.error("[v0] POST /api/admin/promote error:", error)

    // Handle specific errors
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 })
    }

    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
