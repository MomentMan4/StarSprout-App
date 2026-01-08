"use server"

import { requireAdmin } from "@/lib/adminAuth"
import { setFlag, deleteFlag as deleteDbFlag } from "@/lib/db/repositories/flags"
import { writeAuditLog } from "@/lib/db/repositories/adminAudit"
import { revalidatePath } from "next/cache"
import type { FeatureFlagScope } from "@/lib/db/types"

export async function createFlag(data: {
  scope_type: FeatureFlagScope
  scope_id?: string | null
  key: string
  enabled: boolean
  value_json?: Record<string, any> | null
}) {
  const admin = await requireAdmin()

  const flag = await setFlag(data)

  if (!flag) {
    throw new Error("Failed to create flag")
  }

  // Audit log
  await writeAuditLog({
    actor_admin_user_id: admin.userId,
    actor_email: admin.email,
    action_type: "CREATE_FLAG",
    entity_type: "feature_flag",
    entity_id: flag.id,
    after_json: flag,
  })

  revalidatePath("/admin/feature-flags")
  return flag
}

export async function updateFlag(
  flagId: string,
  data: {
    scope_type: FeatureFlagScope
    scope_id?: string | null
    key: string
    enabled: boolean
    value_json?: Record<string, any> | null
  },
) {
  const admin = await requireAdmin()

  const flag = await setFlag(data)

  if (!flag) {
    throw new Error("Failed to update flag")
  }

  // Audit log
  await writeAuditLog({
    actor_admin_user_id: admin.userId,
    actor_email: admin.email,
    action_type: "UPDATE_FLAG",
    entity_type: "feature_flag",
    entity_id: flagId,
    after_json: flag,
  })

  revalidatePath("/admin/feature-flags")
  return flag
}

export async function deleteFlag(flagId: string) {
  const admin = await requireAdmin()

  const success = await deleteDbFlag(flagId)

  if (!success) {
    throw new Error("Failed to delete flag")
  }

  // Audit log
  await writeAuditLog({
    actor_admin_user_id: admin.userId,
    actor_email: admin.email,
    action_type: "DELETE_FLAG",
    entity_type: "feature_flag",
    entity_id: flagId,
  })

  revalidatePath("/admin/feature-flags")
  return true
}

// Quick actions
export async function quickDisableAI() {
  const admin = await requireAdmin()

  await setFlag({
    scope_type: "global",
    key: "ai.enabled",
    enabled: false,
  })

  await writeAuditLog({
    actor_admin_user_id: admin.userId,
    actor_email: admin.email,
    action_type: "DISABLE_AI_GLOBAL",
    entity_type: "feature_flag",
    entity_id: "ai.enabled",
  })

  revalidatePath("/admin/feature-flags")
}

export async function quickDisableSocial() {
  const admin = await requireAdmin()

  await setFlag({
    scope_type: "global",
    key: "social.enabled",
    enabled: false,
  })

  await writeAuditLog({
    actor_admin_user_id: admin.userId,
    actor_email: admin.email,
    action_type: "DISABLE_SOCIAL_GLOBAL",
    entity_type: "feature_flag",
    entity_id: "social.enabled",
  })

  revalidatePath("/admin/feature-flags")
}
