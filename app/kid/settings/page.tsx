"use client"

import { requireChild } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Bell } from "lucide-react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { cardPress } from "@/lib/motion"
import { haptic } from "@/lib/haptics"

export default function KidSettingsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSettings() {
      const user = await requireChild()
      const supabase = await createClient()
      const { data: profile } = await supabase.from("starsprout_users").select("*").eq("id", user.clerkUserId).single()
      setData({ user, profile })
      setLoading(false)
    }
    loadSettings()
  }, [])

  if (loading || !data) {
    return <div>Loading...</div>
  }

  const { profile } = data

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-purple-50 via-blue-50 to-green-50">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/kid/home">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              StarSprout
            </h1>
          </Link>
          <nav className="flex gap-2">
            <Link href="/kid/home">
              <Button variant="ghost" size="sm">
                Home
              </Button>
            </Link>
            <Link href="/kid/rewards">
              <Button variant="ghost" size="sm">
                Rewards
              </Button>
            </Link>
            <Link href="/kid/friends">
              <Button variant="ghost" size="sm">
                Friends
              </Button>
            </Link>
            <Link href="/kid/profile">
              <Button variant="ghost" size="sm">
                Profile
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto flex-1 p-6 max-w-2xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Settings</h2>
          <p className="text-muted-foreground">Your preferences</p>
        </div>

        <div className="space-y-4">
          {/* Profile */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>How you appear in StarSprout</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url || "/placeholder.svg"}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-2xl text-white font-bold">
                      {profile?.nickname?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-lg">{profile?.nickname}</p>
                    <p className="text-sm text-muted-foreground">
                      {profile?.age_band ? profile.age_band.replace("_", "-") + " years" : "Age not set"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
                <CardDescription>Check your inbox for updates</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  You can see your notifications by clicking the bell icon at the bottom right of your screen!
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sign Out */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div variants={cardPress} whileTap="pressed">
                  <Button variant="outline" className="w-full bg-transparent" onClick={() => haptic("tap")}>
                    Sign Out
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
