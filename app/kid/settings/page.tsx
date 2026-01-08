import { requireChild } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Bell } from "lucide-react"

export default async function KidSettingsPage() {
  const user = await requireChild()
  const supabase = await createClient()

  const { data: profile } = await supabase.from("starsprout_users").select("*").eq("id", user.clerkUserId).single()

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
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>How you appear in StarSprout</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url || "/placeholder.svg"} alt="Avatar" className="w-16 h-16 rounded-full" />
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

          {/* Notifications */}
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

          {/* Sign Out */}
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full bg-transparent">
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
