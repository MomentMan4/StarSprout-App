"use server"

import { requireParent, requireChild } from "@/lib/auth"
import { requestFriendship, approveFriendship } from "@/lib/db/repositories/social"
import { notifyFriendRequestPending, notifyFriendRequestApproved } from "@/lib/notify"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"

export async function requestFriendAction(childId: string, friendCode: string) {
  const user = await requireChild()

  if (user.id !== childId) {
    return { success: false, error: "Unauthorized" }
  }

  const rateLimitResult = await rateLimit(`friend_request:${childId}`, RATE_LIMITS.FRIEND_REQUEST)
  if (!rateLimitResult.success) {
    return { success: false, error: "Too many friend requests. Please try again later." }
  }

  const friendship = await requestFriendship({
    child_id: childId,
    friend_code: friendCode,
  })

  if (!friendship) {
    return { success: false, error: "Invalid friend code or request failed" }
  }

  // Notify parent of pending request
  const supabase = await createClient()
  const { data: childData } = await supabase.from("starsprout_users").select("*").eq("id", childId).single()

  const { data: friendData } = await supabase
    .from("starsprout_users")
    .select("*")
    .eq("id", friendship.friend_id)
    .single()

  const { data: parentData } = await supabase
    .from("starsprout_users")
    .select("*")
    .eq("household_id", childData?.household_id)
    .eq("role", "parent")
    .single()

  if (parentData) {
    await notifyFriendRequestPending(parentData.id, childData?.nickname || "Child", friendData?.nickname || "Friend")
  }

  revalidatePath("/kid/friends")
  revalidatePath("/parent/social")

  return { success: true }
}

export async function approveFriendRequestAction(friendshipId: string, approvedBy: string) {
  const user = await requireParent()

  const success = await approveFriendship({
    friendship_id: friendshipId,
    approved_by: approvedBy,
  })

  if (success) {
    // Get friendship details for notifications
    const supabase = await createClient()
    const { data: friendship } = await supabase
      .from("starsprout_friendships")
      .select("*, child:child_id(nickname), friend:friend_id(nickname)")
      .eq("id", friendshipId)
      .single()

    if (friendship) {
      // Notify both children
      await notifyFriendRequestApproved(friendship.child_id, friendship.friend?.nickname || "Friend")
      await notifyFriendRequestApproved(friendship.friend_id, friendship.child?.nickname || "Friend")

      // Haptic feedback
      if ("vibrate" in navigator) {
        navigator.vibrate([50, 30, 50])
      }
    }
  }

  revalidatePath("/parent/social")
  revalidatePath("/kid/friends")

  return { success }
}

export async function denyFriendRequestAction(friendshipId: string) {
  const user = await requireParent()
  const supabase = await createClient()

  const { error } = await supabase.from("starsprout_friendships").update({ status: "denied" }).eq("id", friendshipId)

  if (error) {
    return { success: false }
  }

  revalidatePath("/parent/social")
  return { success: true }
}
