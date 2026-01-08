import { requireAdmin } from "@/lib/adminAuth"
import { listFlags } from "@/lib/db/repositories/flags"
import { FeatureFlagsClient } from "@/components/admin/feature-flags-client"

export default async function FeatureFlagsPage() {
  await requireAdmin()

  const flags = await listFlags()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Feature Flags</h1>
        <p className="text-muted-foreground">Control feature availability across the system</p>
      </div>

      <FeatureFlagsClient flags={flags} />
    </div>
  )
}
