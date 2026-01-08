import { KidProfileClient } from "@/components/kid/kid-profile-client"
import { requireChild } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export default async function KidProfilePage() {
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

  return (
    <KidProfileClient
      user={user}
      points={points}
      streak={streak}
      badges={badges || []}
      totalQuests={totalQuests || 0}
    />
  )
}
