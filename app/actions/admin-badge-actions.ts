"use server"

import { requireAdmin } from "@/lib/adminAuth"
import { createClient } from "@/lib/supabase/server"
import { writeAuditLog } from "@/lib/db/repositories/adminAudit"
import { revalidatePath } from "next/cache"

export async function createBadge(data: {
  badge_key: string
  title: string
  description: string
  category: string
  award_criteria: any
  icon_emoji?: string
  is_active?: boolean
}) {
  const admin = await requireAdmin()
  const supabase = await createClient()

  const { data: badge, error } = await supabase
    .from("starsprout_badges")
    .insert({
      badge_key: data.badge_key,
      title: data.title,
      description: data.description,
      category: data.category,
      award_criteria: data.award_criteria,
      icon_emoji: data.icon_emoji || "🏆",
      is_active: data.is_active !== false,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create badge: ${error.message}`)
  }

  // Audit log
  await writeAuditLog({
    actor_admin_user_id: admin.userId,
    actor_email: admin.email,
    action_type: "CREATE_BADGE",
    entity_type: "badge",
    entity_id: badge.id,
    after_json: badge,
  })

  revalidatePath("/admin/content/badges")
  return badge
}

export async function updateBadge(
  badgeId: string,
  data: {
    title?: string
    description?: string
    category?: string
    award_criteria?: any
    icon_emoji?: string
    is_active?: boolean
  },
) {
  const admin = await requireAdmin()
  const supabase = await createClient()

  // Get current state
  const { data: before } = await supabase.from("starsprout_badges").select("*").eq("id", badgeId).single()

  const { data: badge, error } = await supabase
    .from("starsprout_badges")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", badgeId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update badge: ${error.message}`)
  }

  // Audit log
  await writeAuditLog({
    actor_admin_user_id: admin.userId,
    actor_email: admin.email,
    action_type: "UPDATE_BADGE",
    entity_type: "badge",
    entity_id: badgeId,
    before_json: before,
    after_json: badge,
  })

  revalidatePath("/admin/content/badges")
  return badge
}

export async function deleteBadge(badgeId: string) {
  const admin = await requireAdmin()
  const supabase = await createClient()

  // Get current state for audit log
  const { data: before } = await supabase.from("starsprout_badges").select("*").eq("id", badgeId).single()

  if (!before) {
    throw new Error("Badge not found")
  }

  const { error } = await supabase.from("starsprout_badges").delete().eq("id", badgeId)

  if (error) {
    throw new Error(`Failed to delete badge: ${error.message}`)
  }

  // Audit log
  await writeAuditLog({
    actor_admin_user_id: admin.userId,
    actor_email: admin.email,
    action_type: "DELETE_BADGE",
    entity_type: "badge",
    entity_id: badgeId,
    before_json: before,
    after_json: null,
  })

  revalidatePath("/admin/content/badges")
  return { success: true }
}
