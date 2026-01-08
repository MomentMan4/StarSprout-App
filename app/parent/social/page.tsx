import { requireParent } from "@/lib/auth"
import { ParentSocialClient } from "@/components/parent/parent-social-client"
import { createClient } from "@/lib/supabase/server"

export default async function ParentSocialPage() {
  const user = await requireParent()
  const supabase = await createClient()

  // Get pending friend requests for all children in household
  const { data: pendingRequests } = await supabase
    .from("starsprout_friendships")
    .select(`
      *,
      child:child_id(id, nickname, avatar_url),
      friend:friend_id(id, nickname, avatar_url)
    `)
    .eq("status", "pending")
    .in(
      "child_id",
      supabase.from("starsprout_users").select("id").eq("household_id", user.householdId).eq("role", "child"),
    )

  // Get approved friendships for audit trail
  const { data: approvedFriendships } = await supabase
    .from("starsprout_friendships")
    .select(`
      *,
      child:child_id(id, nickname),
      friend:friend_id(id, nickname)
    `)
    .eq("status", "approved")
    .in(
      "child_id",
      supabase.from("starsprout_users").select("id").eq("household_id", user.householdId).eq("role", "child"),
    )
    .order("approved_at", { ascending: false })
    .limit(20)

  return (
    <ParentSocialClient
      user={user}
      pendingRequests={pendingRequests || []}
      approvedFriendships={approvedFriendships || []}
    />
  )
}
