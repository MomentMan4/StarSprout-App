import { requireChild } from "@/lib/auth"
import { KidFriendsClient } from "@/components/kid/kid-friends-client"
import { getFriendsLeaderboard } from "@/lib/db/repositories/social"
import { createClient } from "@/lib/supabase/server"

export default async function KidFriendsPage() {
  const user = await requireChild()
  const supabase = await createClient()

  // Get friends
  const { data: friendships } = await supabase
    .from("starsprout_friendships")
    .select("*, friend:friend_id(id, nickname, avatar_url)")
    .eq("child_id", user.id)
    .eq("status", "approved")

  const friends = friendships?.map((f: any) => f.friend) || []

  // Get leaderboard
  const leaderboard = await getFriendsLeaderboard(user.id)

  // Get user's own invite code
  const { data: inviteCode } = await supabase
    .from("starsprout_invite_codes")
    .select("*")
    .eq("child_id", user.id)
    .eq("is_active", true)
    .single()

  return <KidFriendsClient user={user} friends={friends} leaderboard={leaderboard} inviteCode={inviteCode?.code} />
}
