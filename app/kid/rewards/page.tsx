import { requireChild } from "@/lib/auth"
import { KidRewardsClient } from "@/components/kid/kid-rewards-client"
import { getUserPoints } from "@/lib/db/repositories/gamification"
import { getHouseholdRewards } from "@/lib/db/repositories/rewards"
import { createClient } from "@/lib/supabase/server"

export default async function KidRewardsPage() {
  const user = await requireChild()
  const supabase = await createClient()

  const [points, rewards] = await Promise.all([getUserPoints(user.id), getHouseholdRewards(user.householdId, true)])

  // Get redemption history
  const { data: redemptions } = await supabase
    .from("starsprout_reward_redemptions")
    .select("*, reward:starsprout_rewards(*)")
    .eq("child_id", user.id)
    .order("requested_at", { ascending: false })
    .limit(10)

  return (
    <KidRewardsClient
      user={user}
      availablePoints={points?.available_points || 0}
      rewards={rewards}
      redemptions={redemptions || []}
    />
  )
}
