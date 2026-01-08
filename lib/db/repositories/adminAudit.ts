// Admin Audit Repository - Logging all admin actions
// Accessible only via requireAdmin() guard

import { createClient } from "@/lib/supabase/server"
import type { AdminAuditLog, AdminActionType, AdminEntityType } from "../types"

// ============================================================================
// WRITE AUDIT LOG
// ============================================================================

export interface WriteAuditLogInput {
  actor_admin_user_id: string
  actor_email: string
  action_type: AdminActionType
  entity_type: AdminEntityType
  entity_id: string
  before_json?: Record<string, any> | null
  after_json?: Record<string, any> | null
  metadata?: Record<string, any> | null
}

export async function writeAuditLog(input: WriteAuditLogInput): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase.from("starsprout_admin_audit_logs").insert({
    actor_admin_user_id: input.actor_admin_user_id,
    actor_email: input.actor_email,
    action_type: input.action_type,
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    before_json: input.before_json || null,
    after_json: input.after_json || null,
    metadata: input.metadata || null,
  })

  if (error) {
    console.error("[v0] Error writing audit log:", error)
    return false
  }

  return true
}

// ============================================================================
// LIST AUDIT LOGS
// ============================================================================

export interface ListAuditLogsFilters {
  actor_admin_user_id?: string
  action_type?: AdminActionType
  entity_type?: AdminEntityType
  entity_id?: string
  from_date?: string
  to_date?: string
}

export interface ListAuditLogsParams {
  filters?: ListAuditLogsFilters
  limit?: number
  offset?: number
}

export async function listAuditLogs(params: ListAuditLogsParams = {}): Promise<{
  logs: AdminAuditLog[]
  total: number
}> {
  const supabase = await createClient()
  const { filters = {}, limit = 50, offset = 0 } = params

  let query = supabase
    .from("starsprout_admin_audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })

  // Apply filters
  if (filters.actor_admin_user_id) {
    query = query.eq("actor_admin_user_id", filters.actor_admin_user_id)
  }
  if (filters.action_type) {
    query = query.eq("action_type", filters.action_type)
  }
  if (filters.entity_type) {
    query = query.eq("entity_type", filters.entity_type)
  }
  if (filters.entity_id) {
    query = query.eq("entity_id", filters.entity_id)
  }
  if (filters.from_date) {
    query = query.gte("created_at", filters.from_date)
  }
  if (filters.to_date) {
    query = query.lte("created_at", filters.to_date)
  }

  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    console.error("[v0] Error listing audit logs:", error)
    return { logs: [], total: 0 }
  }

  return {
    logs: (data as AdminAuditLog[]) || [],
    total: count || 0,
  }
}

// ============================================================================
// GET AUDIT LOGS FOR ENTITY
// ============================================================================

export async function getAuditLogsForEntity(
  entity_type: AdminEntityType,
  entity_id: string,
  limit = 20,
): Promise<AdminAuditLog[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("starsprout_admin_audit_logs")
    .select("*")
    .eq("entity_type", entity_type)
    .eq("entity_id", entity_id)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[v0] Error getting entity audit logs:", error)
    return []
  }

  return (data as AdminAuditLog[]) || []
}
