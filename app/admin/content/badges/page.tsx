import { requireAdmin } from "@/lib/adminAuth"
import { createClient } from "@/lib/supabase/server"
import { BadgesManagementClient } from "@/components/admin/badges-management-client"

export default async function BadgesPage() {
  await requireAdmin()

  const supabase = await createClient()

  // Fetch all badges
  const { data: badges } = await supabase
    .from("starsprout_badges")
    .select("*")
    .order("category", { ascending: true })
    .order("title", { ascending: true })

  // Get badge award counts
  const badgesWithCounts = await Promise.all(
    (badges || []).map(async (badge) => {
      const { count } = await supabase
        .from("starsprout_user_badges")
        .select("*", { count: "exact", head: true })
        .eq("badge_id", badge.id)

      return { ...badge, award_count: count || 0 }
    }),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Badges</h1>
        <p className="text-muted-foreground">Manage system badges and awards</p>
      </div>

      <BadgesManagementClient badges={badgesWithCounts} />
    </div>
  )
}
