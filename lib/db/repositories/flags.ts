// Feature Flags Repository - Manage feature toggles
// Accessible to all users for reading, admins only for writing

import { createClient } from "@/lib/supabase/server"
import type { FeatureFlagNew, FeatureFlagScope } from "../types"

// ============================================================================
// GET FLAG
// ============================================================================

export interface GetFlagInput {
  key: string
  scope_type?: FeatureFlagScope
  scope_id?: string
  user_id?: string // For hierarchical lookup
}

export async function getFlag(input: GetFlagInput): Promise<FeatureFlagNew | null> {
  const supabase = await createClient()

  // If user_id provided, use hierarchical lookup function
  if (input.user_id) {
    const { data, error } = await supabase.rpc("get_effective_flag", {
      p_user_id: input.user_id,
      p_flag_key: input.key,
    })

    if (error || !data || data.length === 0) {
      return null
    }

    // Return synthetic flag object
    return {
      id: "",
      scope_type: "global",
      scope_id: null,
      key: input.key,
      enabled: data[0].enabled,
      value_json: data[0].value_json,
      created_at: "",
      updated_at: "",
    }
  }

  // Direct lookup
  let query = supabase.from("starsprout_feature_flags").select("*").eq("key", input.key)

  if (input.scope_type) {
    query = query.eq("scope_type", input.scope_type)
  }
  if (input.scope_id !== undefined) {
    query = query.eq("scope_id", input.scope_id)
  }

  const { data, error } = await query.single()

  if (error || !data) {
    return null
  }

  return data as FeatureFlagNew
}

// ============================================================================
// SET FLAG
// ============================================================================

export interface SetFlagInput {
  scope_type: FeatureFlagScope
  scope_id?: string | null
  key: string
  enabled: boolean
  value_json?: Record<string, any> | null
}

export async function setFlag(input: SetFlagInput): Promise<FeatureFlagNew | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("starsprout_feature_flags")
    .upsert(
      {
        scope_type: input.scope_type,
        scope_id: input.scope_id || null,
        key: input.key,
        enabled: input.enabled,
        value_json: input.value_json || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "scope_type,scope_id,key",
      },
    )
    .select()
    .single()

  if (error) {
    console.error("[v0] Error setting flag:", error)
    return null
  }

  return data as FeatureFlagNew
}

// ============================================================================
// LIST FLAGS
// ============================================================================

export interface ListFlagsFilters {
  scope_type?: FeatureFlagScope
  scope_id?: string
  key?: string
  enabled?: boolean
}

export async function listFlags(filters: ListFlagsFilters = {}): Promise<FeatureFlagNew[]> {
  const supabase = await createClient()

  let query = supabase.from("starsprout_feature_flags").select("*").order("key", { ascending: true })

  if (filters.scope_type) {
    query = query.eq("scope_type", filters.scope_type)
  }
  if (filters.scope_id !== undefined) {
    query = query.eq("scope_id", filters.scope_id)
  }
  if (filters.key) {
    query = query.ilike("key", `%${filters.key}%`)
  }
  if (filters.enabled !== undefined) {
    query = query.eq("enabled", filters.enabled)
  }

  const { data, error } = await query

  if (error) {
    console.error("[v0] Error listing flags:", error)
    return []
  }

  return (data as FeatureFlagNew[]) || []
}

// ============================================================================
// DELETE FLAG
// ============================================================================

export async function deleteFlag(id: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase.from("starsprout_feature_flags").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting flag:", error)
    return false
  }

  return true
}

// ============================================================================
// CHECK FLAG (Convenience helper)
// ============================================================================

export async function isFlagEnabled(key: string, user_id?: string): Promise<boolean> {
  const flag = await getFlag({ key, user_id })
  return flag?.enabled ?? false
}
