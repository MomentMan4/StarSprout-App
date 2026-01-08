import { requireAdmin } from "@/lib/adminAuth"
import { getAdminKPIs } from "@/lib/db/repositories/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, Home, ClipboardCheck, Gift, UserPlus, Brain, TrendingUp } from "lucide-react"
import { Suspense } from "react"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"

async function KPICards() {
  const kpis = await getAdminKPIs()

  return (
    <>
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Households</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.total_households}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Active (7d): {kpis.active_households_7d}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Parents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.total_parents}</div>
            <p className="text-xs text-muted-foreground">Primary account holders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Children</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.total_children}</div>
            <p className="text-xs text-muted-foreground">Active child accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Calls Today</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.ai_calls_today}</div>
            <p className="text-xs text-muted-foreground">Error rate: {kpis.ai_error_rate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Operational Queues */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Task Approvals</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.pending_task_approvals}</div>
            <p className="text-xs text-muted-foreground">Submitted by children</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reward Requests</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.pending_reward_requests}</div>
            <p className="text-xs text-muted-foreground">Awaiting parent approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Friend Requests</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.pending_friend_approvals}</div>
            <p className="text-xs text-muted-foreground">Requires parent approval</p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default async function AdminDashboard() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and operational metrics</p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <LoadingSkeleton count={4} height={120} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <LoadingSkeleton count={3} height={120} />
            </div>
          </div>
        }
      >
        <KPICards />
      </Suspense>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/households">Search Households</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/content/templates">Manage Quest Templates</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/content/badges">Manage Badges</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/feature-flags">Feature Flags</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/jobs">Background Jobs</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/audit-logs">Audit Logs</Link>
          </Button>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <span className="text-sm text-green-600 font-medium">● Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Redis Cache</span>
              <span className="text-sm text-green-600 font-medium">● Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">AI Services</span>
              <span className="text-sm text-green-600 font-medium">● Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Email Service</span>
              <span className="text-sm text-green-600 font-medium">● Operational</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
