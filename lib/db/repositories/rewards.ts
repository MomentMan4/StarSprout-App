// Rewards Repository - Reward catalog and redemption management

import { createClient } from "@/lib/supabase/server"
import { logActivity } from "./activity"
import type {
  Reward,
  RewardRedemption,
  CreateRewardInput,
  RequestRedemptionInput,
  ApproveRedemptionInput,
  FulfillRedemptionInput,
} from "../types"

// ============================================================================
// REWARD CATALOG
// ============================================================================

export async function getHouseholdRewards(householdId: string, activeOnly = true): Promise<Reward[]> {
  const supabase = await createClient()

  let query = supabase.from("starsprout_rewards").select("*").eq("household_id", householdId)

  if (activeOnly) {
    query = query.eq("is_active", true)
  }

  const { data, error } = await query.order("points_cost", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching rewards:", error)
    return []
  }

  return data || []
}

export async function createReward(input: CreateRewardInput): Promise<Reward | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("starsprout_rewards")
    .insert({
      household_id: input.household_id,
      created_by: input.created_by,
      title: input.title,
      description: input.description || null,
      points_cost: input.points_cost,
      icon_emoji: input.icon_emoji || null,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating reward:", error)
    return null
  }

  return data
}

// ============================================================================
// REDEMPTION MANAGEMENT
// ============================================================================

export async function requestRedemption(input: RequestRedemptionInput): Promise<RewardRedemption | null> {
  const supabase = await createClient()

  // Verify user has enough points
  const { data: userPoints } = await supabase
    .from("starsprout_user_points")
    .select("available_points")
    .eq("user_id", input.child_id)
    .single()

  if (!userPoints || userPoints.available_points < input.points_spent) {
    console.error("[v0] Insufficient points for redemption")
    return null
  }

  const { data, error } = await supabase
    .from("starsprout_reward_redemptions")
    .insert({
      household_id: input.household_id,
      reward_id: input.reward_id,
      child_id: input.child_id,
      points_spent: input.points_spent,
      status: "requested",
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error requesting redemption:", error)
    return null
  }

  // Log activity
  await logActivity({
    household_id: input.household_id,
    user_id: input.child_id,
    event_type: "reward_requested",
    entity_type: "redemption",
    entity_id: data.id,
    metadata: { points_spent: input.points_spent },
  })

  return data
}

export async function approveRedemption(input: ApproveRedemptionInput): Promise<boolean> {
  const supabase = await createClient()

  // Get redemption details
  const { data: redemption } = await supabase
    .from("starsprout_reward_redemptions")
    .select("*, reward:reward_id(*)")
    .eq("id", input.redemption_id)
    .single()

  if (!redemption) return false

  // Deduct points from user
  const { error: pointsError } = await supabase.rpc("spend_points", {
    p_user_id: redemption.child_id,
    p_points: redemption.points_spent,
  })

  if (pointsError) {
    console.error("[v0] Error spending points:", pointsError)
    return false
  }

  // Update redemption status
  const { error } = await supabase
    .from("starsprout_reward_redemptions")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: input.approved_by,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.redemption_id)

  if (error) {
    console.error("[v0] Error approving redemption:", error)
    return false
  }

  // Log activity
  await logActivity({
    household_id: redemption.household_id,
    user_id: input.approved_by,
    event_type: "reward_approved",
    entity_type: "redemption",
    entity_id: input.redemption_id,
    metadata: { child_id: redemption.child_id },
  })

  return true
}

export async function fulfillRedemption(input: FulfillRedemptionInput): Promise<boolean> {
  const supabase = await createClient()

  const { data: redemption } = await supabase
    .from("starsprout_reward_redemptions")
    .select("*")
    .eq("id", input.redemption_id)
    .single()

  if (!redemption) return false

  const { error } = await supabase
    .from("starsprout_reward_redemptions")
    .update({
      status: "fulfilled",
      fulfilled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.redemption_id)

  if (error) {
    console.error("[v0] Error fulfilling redemption:", error)
    return false
  }

  // Log activity
  await logActivity({
    household_id: redemption.household_id,
    user_id: redemption.child_id,
    event_type: "reward_fulfilled",
    entity_type: "redemption",
    entity_id: input.redemption_id,
  })

  return true
}

export async function getPendingRedemptionsForHousehold(householdId: string): Promise<RewardRedemption[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("starsprout_reward_redemptions")
    .select("*")
    .eq("household_id", householdId)
    .eq("status", "requested")
    .order("requested_at", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching pending redemptions:", error)
    return []
  }

  return data || []
}
