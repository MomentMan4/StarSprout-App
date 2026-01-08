"use server"

import { requireAdmin, getAdminIdentity } from "@/lib/adminAuth"
import { createClient } from "@/lib/supabase/server"
import { writeAuditLog } from "@/lib/db/repositories/adminAudit"
import { revalidatePath } from "next/cache"

// ============================================================================
// CREATE GLOBAL TEMPLATE
// ============================================================================

export async function createGlobalTemplateAction(data: {
  title: string
  description: string
  category: string
  suggested_points: number
  icon_emoji: string
  is_active: boolean
}) {
  try {
    await requireAdmin()
    const adminIdentity = await getAdminIdentity()
    const supabase = await createClient()

    const { data: newTemplate, error } = await supabase
      .from("starsprout_quest_templates")
      .insert({
        title: data.title,
        description: data.description,
        category: data.category,
        suggested_points: data.suggested_points,
        icon_emoji: data.icon_emoji,
        is_system_template: true,
        is_archived: !data.is_active,
        household_id: null,
        created_by: null,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    await writeAuditLog({
      actor_admin_user_id: adminIdentity.userId,
      actor_email: adminIdentity.email,
      action_type: "CREATE_QUEST_TEMPLATE",
      entity_type: "quest_template",
      entity_id: newTemplate.id,
      after_json: data,
    })

    revalidatePath("/admin/content/templates")
    return { success: true }
  } catch (error) {
    console.error("[v0] Admin action error:", error)
    return { success: false, error: "Internal server error" }
  }
}

// ============================================================================
// UPDATE GLOBAL TEMPLATE
// ============================================================================

export async function updateGlobalTemplateAction(
  templateId: string,
  data: {
    title: string
    description: string
    category: string
    suggested_points: number
    icon_emoji: string
    is_active: boolean
  },
) {
  try {
    await requireAdmin()
    const adminIdentity = await getAdminIdentity()
    const supabase = await createClient()

    const { data: currentTemplate } = await supabase
      .from("starsprout_quest_templates")
      .select("*")
      .eq("id", templateId)
      .single()

    if (!currentTemplate || !currentTemplate.is_system_template) {
      return { success: false, error: "System template not found" }
    }

    const { error } = await supabase
      .from("starsprout_quest_templates")
      .update({
        title: data.title,
        description: data.description,
        category: data.category,
        suggested_points: data.suggested_points,
        icon_emoji: data.icon_emoji,
        is_archived: !data.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", templateId)

    if (error) {
      return { success: false, error: error.message }
    }

    await writeAuditLog({
      actor_admin_user_id: adminIdentity.userId,
      actor_email: adminIdentity.email,
      action_type: "UPDATE_QUEST_TEMPLATE",
      entity_type: "quest_template",
      entity_id: templateId,
      before_json: {
        title: currentTemplate.title,
        category: currentTemplate.category,
        suggested_points: currentTemplate.suggested_points,
      },
      after_json: data,
    })

    revalidatePath("/admin/content/templates")
    return { success: true }
  } catch (error) {
    console.error("[v0] Admin action error:", error)
    return { success: false, error: "Internal server error" }
  }
}
