import { requireChild } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { QuestDetailClient } from "@/components/kid/quest-detail-client"

export default async function QuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const user = await requireChild()
    const supabase = await createClient()

    const { data: task, error } = await supabase
      .from("starsprout_tasks")
      .select("*")
      .eq("id", id)
      .eq("assigned_to", user.id)
      .eq("household_id", user.householdId)
      .single()

    if (error || !task) {
      console.error("[v0] Error fetching quest:", error)
      notFound()
    }

    return <QuestDetailClient task={task} />
  } catch (error) {
    console.error("[v0] Quest detail page error:", error)
    notFound()
  }
}
