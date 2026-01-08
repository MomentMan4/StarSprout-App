import { requireAdmin } from "@/lib/adminAuth"
import { getHouseholdDetail } from "@/lib/db/repositories/admin"
import { HouseholdDetailClient } from "@/components/admin/household-detail-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { notFound } from "next/navigation"

export default async function HouseholdDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin()

  const householdId = params.id
  const detail = await getHouseholdDetail(householdId)

  if (!detail) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Household Details</h1>
        <p className="text-muted-foreground font-mono text-sm">ID: {householdId}</p>
      </div>

      {/* Household Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Household Information</CardTitle>
          <CardDescription>Read-only household summary</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">{detail.household.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Status</p>
              <Badge>Active</Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Created</p>
              <p className="text-sm text-muted-foreground">{new Date(detail.household.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Last Updated</p>
              <p className="text-sm text-muted-foreground">{new Date(detail.household.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parents */}
      <Card>
        <CardHeader>
          <CardTitle>Parents ({detail.parents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {detail.parents.map((parent) => (
              <div key={parent.id} className="flex items-center justify-between p-2 border rounded-md">
                <div>
                  <p className="font-medium">{parent.nickname}</p>
                  <p className="text-xs text-muted-foreground font-mono">{parent.id}</p>
                </div>
                <Badge variant="outline">Parent</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Children */}
      <Card>
        <CardHeader>
          <CardTitle>Children ({detail.children.length})</CardTitle>
          <CardDescription>Child accounts with age band (no DOB exposed)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {detail.children.map((child) => (
              <div key={child.id} className="flex items-center justify-between p-2 border rounded-md">
                <div>
                  <p className="font-medium">{child.nickname}</p>
                  <p className="text-xs text-muted-foreground font-mono">{child.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{child.age_band || "Unknown"}</Badge>
                  {child.avatar_url && (
                    <img src={child.avatar_url || "/placeholder.svg"} alt="" className="w-8 h-8 rounded-full" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{detail.stats.total_tasks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{detail.stats.completed_tasks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{detail.stats.total_rewards}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Friendships</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{detail.stats.total_friendships}</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Actions */}
      <HouseholdDetailClient householdId={householdId} children={detail.children} />

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Last 20 events (types only, minimal payload)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {detail.recent_activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              detail.recent_activity.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-2 border rounded-md text-sm">
                  <div>
                    <Badge variant="outline">{event.event_type}</Badge>
                    {event.entity_type && <span className="ml-2 text-muted-foreground">{event.entity_type}</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
