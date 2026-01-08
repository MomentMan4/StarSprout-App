// Quests Repository - Quest templates and task management

import { createClient } from "@/lib/supabase/server"
import { logActivity } from "./activity"
import { updateStreakOnTaskCompletion, awardBadgeIfEligible } from "./gamification"
import type {
  QuestTemplate,
  Task,
  AssignTaskInput,
  SubmitTaskInput,
  ApproveTaskInput,
  RejectTaskInput,
  CreateQuestTemplateInput,
} from "../types"

// ============================================================================
// QUEST TEMPLATES
// ============================================================================

export async function getSystemQuestTemplates(): Promise<QuestTemplate[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("starsprout_quest_templates")
    .select("*")
    .eq("is_system_template", true)
    .order("category", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching system templates:", error)
    return []
  }

  return data || []
}

export async function getHouseholdQuestTemplates(householdId: string): Promise<QuestTemplate[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("starsprout_quest_templates")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching household templates:", error)
    return []
  }

  return data || []
}

export async function createQuestTemplate(input: CreateQuestTemplateInput): Promise<QuestTemplate | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("starsprout_quest_templates")
    .insert({
      household_id: input.household_id || null,
      created_by: input.created_by || null,
      title: input.title,
      description: input.description || null,
      category: input.category,
      suggested_points: input.suggested_points || 10,
      icon_emoji: input.icon_emoji || null,
      is_system_template: input.is_system_template || false,
      age_band_min: input.age_band_min || null,
      age_band_max: input.age_band_max || null,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating quest template:", error)
    return null
  }

  return data
}

// ============================================================================
// TASK ASSIGNMENT
// ============================================================================

export async function assignTask(input: AssignTaskInput): Promise<Task | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("starsprout_tasks")
    .insert({
      household_id: input.household_id,
      template_id: input.template_id || null,
      assigned_to: input.assigned_to,
      assigned_by: input.assigned_by,
      title: input.title,
      description: input.description || null,
      category: input.category,
      points: input.points,
      due_date: input.due_date || null,
      status: "pending",
      streak_eligible: input.streak_eligible ?? true,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error assigning task:", error)
    return null
  }

  // Log activity
  await logActivity({
    household_id: input.household_id,
    user_id: input.assigned_by,
    event_type: "task_assigned",
    entity_type: "task",
    entity_id: data.id,
    metadata: { child_id: input.assigned_to },
  })

  return data
}

// ============================================================================
// TASK QUERIES
// ============================================================================

export async function getChildTasks(childId: string, status?: string): Promise<Task[]> {
  const supabase = await createClient()

  let query = supabase
    .from("starsprout_tasks")
    .select("*")
    .eq("assigned_to", childId)
    .order("created_at", { ascending: false })

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) {
    console.error("[v0] Error fetching child tasks:", error)
    return []
  }

  return data || []
}

export async function getPendingApprovalsForHousehold(householdId: string): Promise<Task[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("starsprout_tasks")
    .select("*")
    .eq("household_id", householdId)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching pending approvals:", error)
    return []
  }

  return data || []
}

export async function getTaskById(taskId: string): Promise<Task | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("starsprout_tasks").select("*").eq("id", taskId).single()

  if (error) {
    console.error("[v0] Error fetching task:", error)
    return null
  }

  return data
}

export async function getChildTodayQuests(childId: string): Promise<Task[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("starsprout_tasks")
    .select("*")
    .eq("assigned_to", childId)
    .gte("created_at", today)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching today's quests:", error)
    return []
  }

  return data || []
}

export async function getChildDashboardStats(childId: string): Promise<{
  totalQuests: number
  completedQuests: number
  pendingQuests: number
  submittedQuests: number
}> {
  const supabase = await createClient()

  const { data: allTasks } = await supabase.from("starsprout_tasks").select("status").eq("assigned_to", childId)

  const tasks = allTasks || []

  return {
    totalQuests: tasks.length,
    completedQuests: tasks.filter((t) => t.status === "approved").length,
    pendingQuests: tasks.filter((t) => t.status === "pending").length,
    submittedQuests: tasks.filter((t) => t.status === "submitted").length,
  }
}

// ============================================================================
// TASK ACTIONS
// ============================================================================

export async function submitTask(input: SubmitTaskInput): Promise<boolean> {
  const supabase = await createClient()

  const task = await getTaskById(input.task_id)
  if (!task) return false

  const { error } = await supabase
    .from("starsprout_tasks")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      reflection_text: input.reflection_text || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.task_id)

  if (error) {
    console.error("[v0] Error submitting task:", error)
    return false
  }

  // Log activity
  await logActivity({
    household_id: task.household_id,
    user_id: task.assigned_to,
    event_type: "task_submitted",
    entity_type: "task",
    entity_id: input.task_id,
  })

  return true
}

export async function approveTask(input: ApproveTaskInput): Promise<boolean> {
  const supabase = await createClient()

  const task = await getTaskById(input.task_id)
  if (!task) return false

  // Update task status
  const { error } = await supabase
    .from("starsprout_tasks")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: input.approved_by,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.task_id)

  if (error) {
    console.error("[v0] Error approving task:", error)
    return false
  }

  // Award points to child
  const { error: pointsError } = await supabase.rpc("add_points_to_user", {
    p_user_id: task.assigned_to,
    p_points: task.points,
  })

  if (pointsError) {
    console.error("[v0] Error adding points:", pointsError)
  }

  // Update streak
  if (task.streak_eligible) {
    await updateStreakOnTaskCompletion(task.assigned_to, task.household_id)
  }

  // Check for badge eligibility
  await awardBadgeIfEligible(task.assigned_to, task.household_id)

  // Log activity
  await logActivity({
    household_id: task.household_id,
    user_id: input.approved_by,
    event_type: "task_approved",
    entity_type: "task",
    entity_id: input.task_id,
    metadata: { child_id: task.assigned_to, points: task.points },
  })

  return true
}

export async function rejectTask(input: RejectTaskInput): Promise<boolean> {
  const supabase = await createClient()

  const task = await getTaskById(input.task_id)
  if (!task) return false

  const { error } = await supabase
    .from("starsprout_tasks")
    .update({
      status: "rejected",
      approved_by: input.approved_by,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.task_id)

  if (error) {
    console.error("[v0] Error rejecting task:", error)
    return false
  }

  // Log activity
  await logActivity({
    household_id: task.household_id,
    user_id: input.approved_by,
    event_type: "task_rejected",
    entity_type: "task",
    entity_id: input.task_id,
    metadata: { child_id: task.assigned_to },
  })

  return true
}
