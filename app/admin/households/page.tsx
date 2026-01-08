import { requireAdmin } from "@/lib/adminAuth"
import { searchHouseholds } from "@/lib/db/repositories/admin"
import { HouseholdsSearchClient } from "@/components/admin/households-search-client"

export default async function HouseholdsPage({ searchParams }: { searchParams: { q?: string; id?: string } }) {
  await requireAdmin()

  const results = await searchHouseholds({
    household_id: searchParams.id,
    email: searchParams.q,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Households</h1>
        <p className="text-muted-foreground">Search and manage all households in the system</p>
      </div>

      <HouseholdsSearchClient initialResults={results} />
    </div>
  )
}
