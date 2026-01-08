import { requireAdmin } from "@/lib/adminAuth"
import { JobsClient } from "@/components/admin/jobs-client"

export default async function JobsPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Maintenance Jobs</h1>
        <p className="text-muted-foreground">Run safe system maintenance operations</p>
      </div>

      <JobsClient />
    </div>
  )
}
