import { requireParent } from "@/lib/auth"
import { ParentRewardsClient } from "@/components/parent/parent-rewards-client"
import { getHouseholdRewards, getPendingRedemptionsForHousehold } from "@/lib/db/repositories/rewards"
import { createClient } from "@/lib/supabase/server"

export default async function ParentRewardsPage() {
  const user = await requireParent()
  const supabase = await createClient()

  const [rewards, pendingRedemptions] = await Promise.all([
    getHouseholdRewards(user.householdId, false),
    getPendingRedemptionsForHousehold(user.householdId),
  ])

  // Get history with child names
  const { data: history } = await supabase
    .from("starsprout_reward_redemptions")
    .select("*, child:starsprout_users!child_id(nickname, avatar_url), reward:starsprout_rewards(*)")
    .eq("household_id", user.householdId)
    .in("status", ["approved", "fulfilled", "rejected"])
    .order("requested_at", { ascending: false })
    .limit(20)

  // Get pending with child names
  const { data: pendingWithChildren } = await supabase
    .from("starsprout_reward_redemptions")
    .select("*, child:starsprout_users!child_id(nickname, avatar_url), reward:starsprout_rewards(*)")
    .eq("household_id", user.householdId)
    .eq("status", "requested")
    .order("requested_at", { ascending: false })

  return (
    <ParentRewardsClient
      user={user}
      rewards={rewards}
      pendingRedemptions={pendingWithChildren || []}
      history={history || []}
    />
  )
}
