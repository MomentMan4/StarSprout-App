import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { in_app_enabled, email_enabled, weekly_summary_email } = await request.json()
    const supabase = await createClient()

    await supabase.from("starsprout_notification_preferences").upsert(
      {
        user_id: userId,
        in_app_enabled,
        email_enabled,
        weekly_summary_email,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating notification preferences:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
