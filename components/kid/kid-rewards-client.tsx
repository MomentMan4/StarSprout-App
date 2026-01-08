"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Sparkles, Clock } from "lucide-react"
import { requestReward } from "@/app/actions/reward-actions"
import { haptic } from "@/lib/haptics"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cardPress, staggerIn } from "@/lib/motion"

interface KidRewardsClientProps {
  user: any
  availablePoints: number
  rewards: any[]
  redemptions: any[]
}

export function KidRewardsClient({ user, availablePoints, rewards, redemptions }: KidRewardsClientProps) {
  const [requestingId, setRequestingId] = useState<string | null>(null)
  const router = useRouter()

  const handleRequest = async (rewardId: string, pointsCost: number) => {
    setRequestingId(rewardId)
    haptic("tap")

    const result = await requestReward(rewardId, pointsCost)

    if (result.success) {
      haptic("success")
      router.refresh()
    } else {
      // No haptic on error
    }

    setRequestingId(null)
  }

  const affordableRewards = rewards.filter((r) => r.points_cost <= availablePoints)
  const aspirationalRewards = rewards.filter((r) => r.points_cost > availablePoints)

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/kid/home">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              StarSprout
            </h1>
          </Link>
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-yellow-200 px-4 py-2 rounded-full border-2 border-yellow-300">
            <Star className="h-5 w-5 text-yellow-600" />
            <div className="text-right">
              <p className="text-2xl font-black text-yellow-900">{availablePoints}</p>
              <p className="text-xs font-medium text-yellow-700">Points</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 p-4 pb-24 max-w-4xl">
        <div className="mb-6">
          <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Rewards Shop 🎁
          </h2>
          <p className="text-muted-foreground">Use your points to get awesome rewards!</p>
        </div>

        {affordableRewards.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5" /> You Can Get These Now!
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {affordableRewards.map((reward, index) => (
                <motion.div key={reward.id} variants={staggerIn} initial="initial" animate="animate" custom={index}>
                  <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-lg transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-4xl border-2 border-green-200">
                          {reward.icon_emoji || "🎁"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xl font-bold text-gray-900 mb-1">{reward.title}</h4>
                          {reward.description && <p className="text-sm text-gray-600 mb-2">{reward.description}</p>}
                          <Badge className="bg-green-600 hover:bg-green-700 text-white font-bold">
                            <Star className="h-3 w-3 mr-1" />
                            {reward.points_cost} points
                          </Badge>
                        </div>
                      </div>
                      <motion.div variants={cardPress} whileTap="pressed">
                        <Button
                          onClick={() => handleRequest(reward.id, reward.points_cost)}
                          disabled={requestingId === reward.id}
                          size="lg"
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 font-bold"
                        >
                          {requestingId === reward.id ? "Requesting..." : "Request This! 🎉"}
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {aspirationalRewards.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-indigo-700 mb-4 flex items-center gap-2">
              <Star className="h-5 w-5" /> Keep Going For These!
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {aspirationalRewards.map((reward, index) => (
                <motion.div
                  key={reward.id}
                  variants={staggerIn}
                  initial="initial"
                  animate="animate"
                  custom={affordableRewards.length + index}
                >
                  <Card className="border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 opacity-80">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-4xl border-2 border-gray-200 grayscale">
                          {reward.icon_emoji || "🎁"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xl font-bold text-gray-900 mb-1">{reward.title}</h4>
                          {reward.description && <p className="text-sm text-gray-600 mb-2">{reward.description}</p>}
                          <div className="space-y-1">
                            <Badge variant="secondary" className="font-bold">
                              <Star className="h-3 w-3 mr-1" />
                              {reward.points_cost} points
                            </Badge>
                            <p className="text-xs text-indigo-600 font-medium">
                              Need {reward.points_cost - availablePoints} more points!
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button disabled size="lg" className="w-full font-bold" variant="secondary">
                        Not Enough Points Yet
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {rewards.length === 0 && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">🎁</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No rewards yet!</h3>
            <p className="text-lg text-muted-foreground">Ask your parent to create some rewards</p>
          </motion.div>
        )}

        {redemptions.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Your Requests</h3>
            <Card>
              <CardContent className="p-4 space-y-3">
                {redemptions.map((redemption: any) => (
                  <div key={redemption.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium">
                        {redemption.reward?.icon_emoji} {redemption.reward?.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">{redemption.points_spent} points</p>
                        <p className="text-xs text-muted-foreground">•</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(redemption.requested_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        redemption.status === "fulfilled"
                          ? "default"
                          : redemption.status === "approved"
                            ? "secondary"
                            : redemption.status === "rejected"
                              ? "destructive"
                              : "outline"
                      }
                    >
                      {redemption.status === "requested" && <Clock className="h-3 w-3 mr-1" />}
                      {redemption.status === "requested" ? "Waiting" : redemption.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
