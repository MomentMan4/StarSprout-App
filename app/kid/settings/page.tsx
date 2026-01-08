import { requireChild } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { KidSettingsClient } from "@/components/kid/kid-settings-client"

export default async function KidSettingsPage() {
  const user = await requireChild()
  const supabase = await createClient()

  const { data: profile } = await supabase.from("starsprout_users").select("*").eq("id", user.clerkUserId).single()

  return <KidSettingsClient profile={profile} />
}
