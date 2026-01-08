"use client"

import { useEffect, useState } from "react"
import { requireChild } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Star, Trophy, Flame, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"
import { staggerIn } from "@/lib/motion"

export default function KidProfilePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      const user = await requireChild()
      const supabase = await createClient()

      const { data: points } = await supabase.from("starsprout_user_points").select("*").eq("user_id", user.id).single()
      const { data: streak } = await supabase.from("starsprout_streaks").select("*").eq("user_id", user.id).single()
      const { data: badges } = await supabase
        .from("starsprout_user_badges")
        .select("*, badge:starsprout_badges(*)")
        .eq("user_id", user.id)
        .order("awarded_at", { ascending: false })
      const { count: totalQuests } = await supabase
        .from("starsprout_tasks")
        .select("*", { count: "exact", head: true })
        .eq("assigned_to", user.id)
        .eq("status", "approved")

      setData({ user, points, streak, badges, totalQuests })
      setLoading(false)
    }

    loadProfile()
  }, [])

  if (loading || !data) {
    return <div>Loading...</div>
  }

  const { user, points, streak, badges, totalQuests } = data

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/kid/home">
            <h1 className="text-2xl font-bold text-indigo-600">StarSprout</h1>
          </Link>
        </div>
      </header>

      <main className="container mx-auto flex-1 p-6 max-w-4xl">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="mb-8 bg-gradient-to-br from-indigo-100 to-purple-100 border-indigo-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
                  {user.nickname.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-3xl font-bold mb-1">{user.nickname}</h2>
                <p className="text-muted-foreground">{user.ageBand?.replace("_", " ")}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[
            { label: "Total Points", value: points?.total_points || 0, icon: Star, color: "text-yellow-500" },
            { label: "Current Streak", value: streak?.current_streak || 0, icon: Flame, color: "text-orange-500" },
            { label: "Best Streak", value: streak?.longest_streak || 0, icon: TrendingUp, color: "text-green-500" },
            { label: "Quests Done", value: totalQuests || 0, icon: Trophy, color: "text-purple-500" },
          ].map((stat, index) => (
            <motion.div key={stat.label} variants={staggerIn} initial="initial" animate="animate" custom={index}>
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Badges Collection */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Badge Collection</CardTitle>
            <CardDescription>All the badges you've earned</CardDescription>
          </CardHeader>
          <CardContent>
            {badges && badges.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {badges.map((userBadge: any, index: number) => (
                  <motion.div
                    key={userBadge.id}
                    variants={staggerIn}
                    initial="initial"
                    animate="animate"
                    custom={index}
                    whileHover={{ scale: 1.05 }}
                    className="flex flex-col items-center p-6 rounded-lg bg-gradient-to-br from-yellow-100 to-yellow-200 border-2 border-yellow-300"
                  >
                    <div className="text-5xl mb-3">🏆</div>
                    <p className="text-sm font-bold text-center mb-1">{userBadge.badge?.title}</p>
                    {userBadge.badge?.description && (
                      <p className="text-xs text-center text-gray-600">{userBadge.badge.description}</p>
                    )}
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {new Date(userBadge.awarded_at).toLocaleDateString()}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-2">No badges yet!</p>
                <p className="text-sm text-muted-foreground">Complete quests to earn your first badge</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
