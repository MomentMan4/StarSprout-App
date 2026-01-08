// Social Repository - Friends and leaderboards

import { createClient } from "@/lib/supabase/server"
import { logActivity } from "./activity"
import { getInviteCodeByCode, invalidateInviteCode } from "./onboarding"
import type { Friendship, RequestFriendshipInput, ApproveFriendshipInput, LeaderboardEntry } from "../types"

// ============================================================================
// FRIENDSHIPS
// ============================================================================

export async function requestFriendship(input: RequestFriendshipInput): Promise<Friendship | null> {
  const supabase = await createClient()

  // Lookup invite code
  const inviteCode = await getInviteCodeByCode(input.friend_code)
  if (!inviteCode) {
    console.error("[v0] Invalid invite code")
    return null
  }

  // Check if code is expired
  if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
    console.error("[v0] Invite code expired")
    return null
  }

  // Check if friendship already exists
  const { data: existing } = await supabase
    .from("starsprout_friendships")
    .select("*")
    .eq("child_id", input.child_id)
    .eq("friend_id", inviteCode.child_id)
    .single()

  if (existing) {
    console.error("[v0] Friendship already exists")
    return null
  }

  // Create friendship request
  const { data, error } = await supabase
    .from("starsprout_friendships")
    .insert({
      child_id: input.child_id,
      friend_id: inviteCode.child_id,
      status: "pending",
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating friendship:", error)
    return null
  }

  // Invalidate invite code after use
  await invalidateInviteCode(inviteCode.id)

  // Get household for logging
  const { data: user } = await supabase
    .from("starsprout_users")
    .select("household_id")
    .eq("id", input.child_id)
    .single()

  if (user) {
    await logActivity({
      household_id: user.household_id,
      user_id: input.child_id,
      event_type: "friend_requested",
      entity_type: "friendship",
      entity_id: data.id,
    })
  }

  return data
}

export async function approveFriendship(input: ApproveFriendshipInput): Promise<boolean> {
  const supabase = await createClient()

  const { data: friendship } = await supabase
    .from("starsprout_friendships")
    .select("*")
    .eq("id", input.friendship_id)
    .single()

  if (!friendship) return false

  // Update friendship status
  const { error } = await supabase
    .from("starsprout_friendships")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: input.approved_by,
    })
    .eq("id", input.friendship_id)

  if (error) {
    console.error("[v0] Error approving friendship:", error)
    return false
  }

  // Create reciprocal friendship
  await supabase.from("starsprout_friendships").insert({
    child_id: friendship.friend_id,
    friend_id: friendship.child_id,
    status: "approved",
    approved_at: new Date().toISOString(),
    approved_by: input.approved_by,
  })

  // Get household for logging
  const { data: user } = await supabase
    .from("starsprout_users")
    .select("household_id")
    .eq("id", friendship.child_id)
    .single()

  if (user) {
    await logActivity({
      household_id: user.household_id,
      user_id: input.approved_by,
      event_type: "friend_approved",
      entity_type: "friendship",
      entity_id: input.friendship_id,
    })
  }

  return true
}

export async function getUserFriends(userId: string): Promise<string[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("starsprout_friendships")
    .select("friend_id")
    .eq("child_id", userId)
    .eq("status", "approved")

  if (error) {
    console.error("[v0] Error fetching friends:", error)
    return []
  }

  return data?.map((f) => f.friend_id) || []
}

// ============================================================================
// LEADERBOARDS
// ============================================================================

export async function getFriendsLeaderboard(userId: string): Promise<LeaderboardEntry[]> {
  const supabase = await createClient()

  // Get user's friends
  const friendIds = await getUserFriends(userId)
  const allUserIds = [userId, ...friendIds]

  if (allUserIds.length === 0) return []

  // Get points and user info for all
  const { data, error } = await supabase
    .from("starsprout_user_points")
    .select("*, user:user_id(id, nickname, avatar_url)")
    .in("user_id", allUserIds)
    .order("weekly_points", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching leaderboard:", error)
    return []
  }

  // Transform to leaderboard entries
  return (
    data?.map((entry: any, index: number) => ({
      user_id: entry.user_id,
      nickname: entry.user?.nickname || "Unknown",
      avatar_url: entry.user?.avatar_url || null,
      points: entry.weekly_points,
      quests_completed: 0, // Would need to count approved tasks this week
      rank: index + 1,
    })) || []
  )
}
