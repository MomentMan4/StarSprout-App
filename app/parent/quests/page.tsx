import { requireParent } from "@/lib/auth"
import { getHouseholdChildren } from "@/lib/db/repositories/onboarding"
import { getSystemQuestTemplates, getHouseholdQuestTemplates } from "@/lib/db/repositories/quests"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { AssignQuestSheet } from "@/components/parent/assign-quest-sheet"
import { PendingApprovalCard } from "@/components/parent/pending-approval-card"
import { QuestTemplateGrid } from "@/components/parent/quest-template-grid"

export default async function ParentQuestsPage() {
  const user = await requireParent()
  const supabase = await createClient()

  // Fetch children
  const children = await getHouseholdChildren(user.householdId)

  // Fetch all tasks
  const { data: allTasks } = await supabase
    .from("starsprout_tasks")
    .select("*, assigned_to_user:starsprout_users!assigned_to(nickname)")
    .eq("household_id", user.householdId)
    .order("created_at", { ascending: false })

  const pendingTasks = allTasks?.filter((t) => t.status === "pending") || []
  const submittedTasks = allTasks?.filter((t) => t.status === "submitted") || []
  const completedTasks = allTasks?.filter((t) => t.status === "approved") || []

  // Fetch templates
  const systemTemplates = await getSystemQuestTemplates()
  const householdTemplates = await getHouseholdQuestTemplates(user.householdId)
  const allTemplates = [...householdTemplates, ...systemTemplates]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/parent/dashboard">
            <h1 className="text-2xl font-bold text-indigo-600">StarSprout</h1>
          </Link>
          <nav className="flex gap-4">
            <Link href="/parent/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/parent/quests">
              <Button variant="default">Quests</Button>
            </Link>
            <Link href="/parent/rewards">
              <Button variant="ghost">Rewards</Button>
            </Link>
            <Link href="/parent/settings">
              <Button variant="ghost">Settings</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Quest Management</h2>
            <p className="text-muted-foreground">Assign, review, and track quests</p>
          </div>
          <AssignQuestSheet children={children} templates={allTemplates} parentId={user.clerkUserId} />
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">Active ({pendingTasks.length})</TabsTrigger>
            <TabsTrigger value="submitted">
              To Review ({submittedTasks.length})
              {submittedTasks.length > 0 && <Badge className="ml-2 bg-orange-500">{submittedTasks.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
            <TabsTrigger value="templates">Templates ({allTemplates.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Active Quests</CardTitle>
                <CardDescription>Quests assigned and waiting for completion</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingTasks.length > 0 ? (
                  <div className="space-y-3">
                    {pendingTasks.map((task: any) => (
                      <div key={task.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex-1">
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {task.assigned_to_user?.nickname} • {task.points} points • {task.category}
                          </p>
                          {task.due_date && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">No active quests</p>
                    <p className="text-sm text-muted-foreground mt-2">Assign a quest to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submitted">
            <Card>
              <CardHeader>
                <CardTitle>Quests to Review</CardTitle>
                <CardDescription>Children have submitted these quests for your approval</CardDescription>
              </CardHeader>
              <CardContent>
                {submittedTasks.length > 0 ? (
                  <div className="space-y-3">
                    {submittedTasks.map((task: any) => (
                      <PendingApprovalCard key={task.id} task={task} parentId={user.clerkUserId} />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">No quests pending review</p>
                    <p className="text-sm text-muted-foreground mt-2">You'll see submitted quests here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Completed Quests</CardTitle>
                <CardDescription>Successfully completed and approved quests</CardDescription>
              </CardHeader>
              <CardContent>
                {completedTasks.length > 0 ? (
                  <div className="space-y-3">
                    {completedTasks.slice(0, 20).map((task: any) => (
                      <div key={task.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex-1">
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {task.assigned_to_user?.nickname} • {task.points} points • {task.category}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Completed: {new Date(task.approved_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="default" className="bg-green-500">
                          Completed
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">No completed quests yet</p>
                    <p className="text-sm text-muted-foreground mt-2">Completed quests will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <QuestTemplateGrid templates={allTemplates} children={children} parentId={user.clerkUserId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
