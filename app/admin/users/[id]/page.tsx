import { requireAdmin } from "@/lib/adminAuth"
import { createClient } from "@/lib/supabase/server"
import { UserDetailClient } from "@/components/admin/user-detail-client"
import { getAuditLogsForEntity } from "@/lib/db/repositories/adminAudit"
import { notFound } from "next/navigation"

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin()
  const supabase = await createClient()
  const userId = params.id

  const { data: user, error } = await supabase.from("starsprout_users").select("*").eq("id", userId).single()

  if (error || !user) {
    notFound()
  }

  // Get household name
  const { data: household } = await supabase
    .from("starsprout_households")
    .select("name")
    .eq("id", user.household_id)
    .single()

  // Get last activity
  const { data: lastActivity } = await supabase
    .from("starsprout_activity_events")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  // Get consent records if child
  let consentRecords = []
  if (user.role === "child") {
    const { data: consents } = await supabase
      .from("starsprout_user_consents")
      .select("*")
      .eq("user_id", userId)
      .order("granted_at", { ascending: false })

    consentRecords = consents || []
  }

  // Get audit history
  const auditLogs = await getAuditLogsForEntity("user", userId, 20)

  const userData = {
    ...user,
    household_name: household?.name || "Unknown",
    last_activity: lastActivity?.created_at || null,
    consent_records: consentRecords,
    audit_logs: auditLogs,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
        <p className="text-muted-foreground">ID: {userId}</p>
      </div>

      <UserDetailClient user={userData} />
    </div>
  )
}
