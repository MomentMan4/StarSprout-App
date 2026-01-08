// Activity Repository - Event logging and audit trail

import { createClient } from "@/lib/supabase/server"
import type { EventType, ActivityEvent } from "../types"

export interface LogActivityInput {
  household_id: string
  user_id?: string | null
  event_type: EventType
  entity_type?: string | null
  entity_id?: string | null
  metadata?: Record<string, any> | null
}

export async function logActivity(input: LogActivityInput): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase.from("starsprout_activity_events").insert({
    household_id: input.household_id,
    user_id: input.user_id || null,
    event_type: input.event_type,
    entity_type: input.entity_type || null,
    entity_id: input.entity_id || null,
    metadata: input.metadata || null,
  })

  if (error) {
    console.error("[v0] Error logging activity:", error)
    return false
  }

  return true
}

export async function getRecentActivity(householdId: string, limit = 20): Promise<ActivityEvent[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("starsprout_activity_events")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[v0] Error fetching activity:", error)
    return []
  }

  return data || []
}
