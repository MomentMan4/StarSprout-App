"use client"

import { requireChild } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { QuestDetailClient } from "@/components/kid/quest-detail-client"

export default async function QuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireChild()
  const supabase = await createClient()

  const { data: task } = await supabase
    .from("starsprout_tasks")
    .select("*")
    .eq("id", id)
    .eq("assigned_to", user.id)
    .single()

  if (!task) {
    notFound()
  }

  return <QuestDetailClient task={task} />
}
