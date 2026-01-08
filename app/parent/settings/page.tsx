import { requireParent } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ParentSettingsClient } from "@/components/parent/parent-settings-client"

export default async function ParentSettingsPage() {
  const user = await requireParent()
  const supabase = await createClient()

  const { data: household } = await supabase
    .from("starsprout_households")
    .select("*")
    .eq("id", user.householdId)
    .single()

  const { data: children } = await supabase
    .from("starsprout_users")
    .select("*")
    .eq("household_id", user.householdId)
    .eq("role", "child")

  const { data: notificationPrefs } = await supabase
    .from("starsprout_notification_preferences")
    .select("*")
    .eq("user_id", user.clerkUserId)
    .single()

  const { data: featureFlags } = await supabase
    .from("starsprout_feature_flags")
    .select("*")
    .or(`household_id.eq.${user.householdId},user_id.eq.${user.clerkUserId}`)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/parent/dashboard">
            <h1 className="text-2xl font-bold text-indigo-600">StarSprout</h1>
          </Link>
          <nav className="flex gap-4">
            <Link href="/parent/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/parent/quests">
              <Button variant="ghost">Quests</Button>
            </Link>
            <Link href="/parent/rewards">
              <Button variant="ghost">Rewards</Button>
            </Link>
            <Link href="/parent/settings">
              <Button variant="default">Settings</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto flex-1 p-6 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Settings</h2>
          <p className="text-muted-foreground">Manage your household and preferences</p>
        </div>

        <ParentSettingsClient
          household={household}
          children={children || []}
          notificationPrefs={notificationPrefs}
          featureFlags={featureFlags || []}
          userId={user.clerkUserId}
          householdId={user.householdId}
        />
      </main>
    </div>
  )
}
