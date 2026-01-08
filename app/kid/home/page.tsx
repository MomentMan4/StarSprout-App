import { requireChild } from "@/lib/auth"
import { KidHomeClient } from "@/components/kid/kid-home-client"
import { getChildTodayQuests, getChildDashboardStats } from "@/lib/db/repositories/quests"
import { getUserPoints, getUserStreak, getUserBadges } from "@/lib/db/repositories/gamification"

export default async function KidHomePage() {
  const user = await requireChild()

  const [todayQuests, stats, points, streak, badges] = await Promise.all([
    getChildTodayQuests(user.id),
    getChildDashboardStats(user.id),
    getUserPoints(user.id),
    getUserStreak(user.id),
    getUserBadges(user.id),
  ])

  return (
    <KidHomeClient
      user={user}
      todayQuests={todayQuests}
      stats={stats}
      points={points}
      streak={streak}
      badges={badges?.slice(0, 3) || []}
    />
  )
}
