"use server"

import { requireParent, requireChild } from "@/lib/auth"
import { assignTask, approveTask, rejectTask, submitTask as submitTaskRepo } from "@/lib/db/repositories/quests"
import { notifyTaskAssigned, notifyTaskApproved, notifyTaskRejected, notifyTaskSubmitted } from "@/lib/notify"
import { revalidatePath } from "next/cache"

export async function assignQuestAction(input: {
  assignedTo: string
  assignedBy: string
  templateId: string | null
  title: string
  description: string | null
  category: string
  points: number
  dueDate: string | null
  streakEligible: boolean
}) {
  const user = await requireParent()

  const task = await assignTask({
    household_id: user.householdId,
    template_id: input.templateId,
    assigned_to: input.assignedTo,
    assigned_by: input.assignedBy,
    title: input.title,
    description: input.description,
    category: input.category,
    points: input.points,
    due_date: input.dueDate,
    streak_eligible: input.streakEligible,
  })

  if (task) {
    // Send notification to child
    await notifyTaskAssigned(input.assignedTo, task.id, task.title)
  }

  revalidatePath("/parent/quests")
  return { success: !!task }
}

export async function approveQuestAction(taskId: string, approvedBy: string) {
  const user = await requireParent()

  const success = await approveTask({
    task_id: taskId,
    approved_by: approvedBy,
  })

  if (success) {
    // Get task details for notification
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    const { data: task } = await supabase.from("starsprout_tasks").select("*").eq("id", taskId).single()

    if (task) {
      await notifyTaskApproved(task.assigned_to, task.id, task.title, task.points)
    }
  }

  revalidatePath("/parent/quests")
  return { success }
}

export async function rejectQuestAction(taskId: string, approvedBy: string, reason?: string) {
  const user = await requireParent()

  const success = await rejectTask({
    task_id: taskId,
    approved_by: approvedBy,
  })

  if (success) {
    // Get task details for notification
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    const { data: task } = await supabase.from("starsprout_tasks").select("*").eq("id", taskId).single()

    if (task) {
      await notifyTaskRejected(task.assigned_to, task.id, task.title, reason)
    }
  }

  revalidatePath("/parent/quests")
  return { success }
}

export async function submitTask(taskId: string, reflectionText?: string) {
  const user = await requireChild()

  const success = await submitTaskRepo({
    task_id: taskId,
    reflection_text: reflectionText,
  })

  if (success) {
    // Get task details for notification
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    const { data: task } = await supabase.from("starsprout_tasks").select("*").eq("id", taskId).single()

    if (task) {
      // Notify parent
      await notifyTaskSubmitted(task.assigned_by, task.id, task.title, user.nickname || "Child")
    }
  }

  revalidatePath("/kid/home")
  revalidatePath("/parent/quests")
  return { success }
}
