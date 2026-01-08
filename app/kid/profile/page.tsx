import { requireChild } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Star, Trophy, Flame, TrendingUp } from "lucide-react"

export default async function KidProfilePage() {
  const user = await requireChild()
  const supabase = await createClient()

  // Get user stats
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

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Points</p>
                  <p className="text-2xl font-bold">{points?.total_points || 0}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-2xl font-bold">{streak?.current_streak || 0}</p>
                </div>
                <Flame className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Best Streak</p>
                  <p className="text-2xl font-bold">{streak?.longest_streak || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Quests Done</p>
                  <p className="text-2xl font-bold">{totalQuests || 0}</p>
                </div>
                <Trophy className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
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
                {badges.map((userBadge: any) => (
                  <div
                    key={userBadge.id}
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
                  </div>
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
