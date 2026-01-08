"use server"

import { requireAdmin } from "@/lib/adminAuth"
import { listAuditLogs, type ListAuditLogsFilters } from "@/lib/db/repositories/adminAudit"

export async function getAuditLogsAction(params: {
  filters?: ListAuditLogsFilters
  limit?: number
  offset?: number
}): Promise<{ logs: any[]; total: number }> {
  await requireAdmin()

  return await listAuditLogs(params)
}
