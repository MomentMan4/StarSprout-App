import { requireAdmin } from "@/lib/adminAuth"
import { AuditLogsClient } from "@/components/admin/audit-logs-client"

export default async function AuditLogsPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">View all admin actions and system events</p>
      </div>

      <AuditLogsClient />
    </div>
  )
}
