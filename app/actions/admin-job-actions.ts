"use server"

import { requireAdmin, getAdminIdentity } from "@/lib/adminAuth"
import {
  runRecomputeLeaderboards,
  runRecomputeStreaks,
  runRegenerateWeeklySummary,
  runReplayNotifications,
  type JobType,
  type JobScope,
} from "@/lib/db/repositories/adminJobs"
import { writeAuditLog } from "@/lib/db/repositories/adminAudit"
import { rateLimit } from "@/lib/rate-limit"

export async function runJobAction(
  jobType: JobType,
  scope: JobScope,
  params: Record<string, any> = {},
): Promise<{ success: boolean; affected: number; error?: string }> {
  await requireAdmin()
  const identity = await getAdminIdentity()

  if (!identity) {
    return { success: false, affected: 0, error: "Admin identity not found" }
  }

  // Rate limit job execution
  const rateLimitKey = `admin_job:${identity.userId}:${jobType}`
  const rateLimitResult = await rateLimit(rateLimitKey, { uniqueTokenPerInterval: 3, interval: 60000 }) // 3 per minute

  if (!rateLimitResult.success) {
    return {
      success: false,
      affected: 0,
      error: "Rate limit exceeded. Please wait before running this job again.",
    }
  }

  let result: { success: boolean; affected: number; error?: string }

  try {
    // Execute the appropriate job
    switch (jobType) {
      case "recompute_leaderboards":
        result = await runRecomputeLeaderboards(scope, params.householdId)
        break
      case "recompute_streaks":
        result = await runRecomputeStreaks(scope, params.householdId)
        break
      case "regenerate_weekly_summary":
        if (!params.householdId) {
          return { success: false, affected: 0, error: "Household ID required" }
        }
        result = await runRegenerateWeeklySummary(params.householdId, params.useAI || false)
        break
      case "replay_notifications":
        if (!params.householdId || !params.fromDate || !params.toDate) {
          return { success: false, affected: 0, error: "Household ID and date range required" }
        }

        // Validate 7-day window
        const from = new Date(params.fromDate)
        const to = new Date(params.toDate)
        const daysDiff = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)

        if (daysDiff > 7) {
          return { success: false, affected: 0, error: "Maximum 7-day window allowed" }
        }

        result = await runReplayNotifications(params.householdId, params.fromDate, params.toDate)
        break
      default:
        return { success: false, affected: 0, error: "Unknown job type" }
    }

    // Log to audit
    await writeAuditLog({
      actor_admin_user_id: identity.userId,
      actor_email: identity.email,
      action_type: "RUN_JOB",
      entity_type: "job",
      entity_id: jobType,
      before_json: { params },
      after_json: { result },
    })

    return result
  } catch (error) {
    console.error("[v0] Job execution error:", error)
    return { success: false, affected: 0, error: String(error) }
  }
}
