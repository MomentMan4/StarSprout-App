import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { demoteAdmin } from "@/lib/db/repositories/adminUsers"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] POST /api/admin/demote - Starting")

    // Require admin access
    const admin = await requireAdmin()

    // Get request body
    const body = await request.json()
    const { targetEmail, targetUserId } = body

    console.log("[v0] Demote request:", { targetEmail, targetUserId })

    // Validate input
    if (!targetEmail && !targetUserId) {
      return NextResponse.json({ success: false, error: "Must provide targetEmail or targetUserId" }, { status: 400 })
    }

    // Demote the user
    const result = await demoteAdmin({
      targetEmail,
      targetUserId,
      actorAdmin: admin,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, userId: result.userId })
  } catch (error: any) {
    console.error("[v0] POST /api/admin/demote error:", error)

    // Handle specific errors
    if (error.message === "Admin access required" || error.message === "Authentication required") {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 })
    }

    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
