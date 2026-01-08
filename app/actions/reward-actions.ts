"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import {
  createReward as createRewardRepo,
  requestRedemption as requestRedemptionRepo,
  approveRedemption as approveRedemptionRepo,
} from "@/lib/db/repositories/rewards"
import { notifyRewardRequested, notifyRewardApproved, notifyRewardRejected } from "@/lib/notify"
import { createClient } from "@/lib/supabase/server"
import type { CreateRewardInput } from "@/lib/db/types"

export async function createRewardAction(input: CreateRewardInput) {
  const user = await getCurrentUser()
  if (!user || user.role !== "parent") {
    return { success: false, error: "Unauthorized" }
  }

  const reward = await createRewardRepo(input)

  if (reward) {
    revalidatePath("/parent/rewards")
    return { success: true, reward }
  }

  return { success: false, error: "Failed to create reward" }
}

export async function requestReward(rewardId: string, pointsCost: number) {
  const user = await getCurrentUser()
  if (!user || user.role !== "child") {
    return { success: false, error: "Unauthorized" }
  }

  const redemption = await requestRedemptionRepo({
    household_id: user.householdId,
    reward_id: rewardId,
    child_id: user.id,
    points_spent: pointsCost,
  })

  if (redemption) {
    // Notify parents
    const supabase = await createClient()
    const { data: parents } = await supabase
      .from("starsprout_users")
      .select("id")
      .eq("household_id", user.householdId)
      .eq("role", "parent")

    for (const parent of parents || []) {
      await notifyRewardRequested(parent.id, user.id, rewardId)
    }

    revalidatePath("/kid/rewards")
    revalidatePath("/parent/rewards")
    return { success: true }
  }

  return { success: false, error: "Failed to request redemption" }
}

export async function approveRedemption(redemptionId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "parent") {
    return { success: false, error: "Unauthorized" }
  }

  const supabase = await createClient()
  const { data: redemption } = await supabase
    .from("starsprout_reward_redemptions")
    .select("*, reward:starsprout_rewards(*)")
    .eq("id", redemptionId)
    .single()

  if (!redemption) {
    return { success: false, error: "Redemption not found" }
  }

  const success = await approveRedemptionRepo({
    redemption_id: redemptionId,
    approved_by: user.id,
  })

  if (success) {
    await notifyRewardApproved(redemption.child_id, redemptionId)
    revalidatePath("/parent/rewards")
    revalidatePath("/kid/rewards")
    return { success: true }
  }

  return { success: false, error: "Failed to approve redemption" }
}

export async function rejectRedemption(redemptionId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "parent") {
    return { success: false, error: "Unauthorized" }
  }

  const supabase = await createClient()

  const { data: redemption } = await supabase
    .from("starsprout_reward_redemptions")
    .select("*")
    .eq("id", redemptionId)
    .single()

  if (!redemption) {
    return { success: false, error: "Redemption not found" }
  }

  const { error } = await supabase
    .from("starsprout_reward_redemptions")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", redemptionId)

  if (!error) {
    await notifyRewardRejected(redemption.child_id, redemptionId)
    revalidatePath("/parent/rewards")
    revalidatePath("/kid/rewards")
    return { success: true }
  }

  return { success: false, error: "Failed to reject redemption" }
}
