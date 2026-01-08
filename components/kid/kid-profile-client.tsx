"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Star, Trophy, Flame, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"
import { staggerContainer, staggerIn } from "@/lib/motion"

interface KidProfileClientProps {
  user: {
    id: string
    nickname: string
    ageBand?: string
  }
  points: {
    total_points: number
  } | null
  streak: {
    current_streak: number
    longest_streak: number
  } | null
  badges: Array<{
    id: string
    awarded_at: string
    badge: {
      title: string
      description: string | null
    }
  }>
  totalQuests: number
}

export function KidProfileClient({ user, points, streak, badges, totalQuests }: KidProfileClientProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/kid/home">
            <h1 className="text-2xl font-bold text-indigo-600">StarSprout</h1>
          </Link>
        </div>
      </header>

      <main className="container mx-auto flex-1 p-4 sm:p-6 max-w-4xl">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="mb-6 sm:mb-8 bg-gradient-to-br from-indigo-100 to-purple-100 border-indigo-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl sm:text-4xl">
                  {user.nickname.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1">{user.nickname}</h2>
                <p className="text-sm sm:text-base text-muted-foreground">{user.ageBand?.replace("_", " ")}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 mb-6 sm:mb-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {[
            { label: "Total Points", value: points?.total_points || 0, icon: Star, color: "text-yellow-500" },
            { label: "Current Streak", value: streak?.current_streak || 0, icon: Flame, color: "text-orange-500" },
            { label: "Best Streak", value: streak?.longest_streak || 0, icon: TrendingUp, color: "text-green-500" },
            { label: "Quests Done", value: totalQuests || 0, icon: Trophy, color: "text-purple-500" },
          ].map((stat) => (
            <motion.div key={stat.label} variants={staggerIn}>
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="mb-2 sm:mb-0">
                      <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                    </div>
                    <stat.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Badges Collection */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Badge Collection</CardTitle>
            <CardDescription className="text-sm">All the badges you've earned</CardDescription>
          </CardHeader>
          <CardContent>
            {badges && badges.length > 0 ? (
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {badges.map((userBadge: any) => (
                  <motion.div
                    key={userBadge.id}
                    variants={staggerIn}
                    whileHover={{ scale: 1.05 }}
                    className="flex flex-col items-center p-4 sm:p-6 rounded-lg bg-gradient-to-br from-yellow-100 to-yellow-200 border-2 border-yellow-300"
                  >
                    <div className="text-4xl sm:text-5xl mb-2 sm:mb-3">🏆</div>
                    <p className="text-xs sm:text-sm font-bold text-center mb-1">{userBadge.badge?.title}</p>
                    {userBadge.badge?.description && (
                      <p className="text-xs text-center text-gray-600 hidden sm:block">{userBadge.badge.description}</p>
                    )}
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {new Date(userBadge.awarded_at).toLocaleDateString()}
                    </Badge>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <p className="text-base sm:text-lg text-muted-foreground mb-2">No badges yet!</p>
                <p className="text-sm text-muted-foreground">Complete quests to earn your first badge</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
