import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { householdId, flags } = await request.json()
    const supabase = await createClient()

    // Update each feature flag
    for (const [flagKey, isEnabled] of Object.entries(flags)) {
      await supabase.from("starsprout_feature_flags").upsert(
        {
          flag_key: flagKey,
          flag_name: flagKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          household_id: householdId,
          user_id: userId,
          is_enabled: isEnabled as boolean,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "flag_key,household_id,user_id",
        },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating feature flags:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
