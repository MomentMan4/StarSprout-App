import { requireAdmin } from "@/lib/adminAuth"
import { getSystemQuestTemplates } from "@/lib/db/repositories/quests"
import { QuestTemplatesClient } from "@/components/admin/quest-templates-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { FileText } from "lucide-react"

export default async function QuestTemplatesPage() {
  await requireAdmin()

  const templates = await getSystemQuestTemplates()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quest Templates</h1>
          <p className="text-muted-foreground">Manage system quest templates available to all households</p>
        </div>
      </div>

      {templates.length > 0 ? (
        <QuestTemplatesClient templates={templates} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>System Templates</CardTitle>
            <CardDescription>Create and edit quest templates available to all households</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={FileText}
              title="Quest templates"
              description="No templates available. Create a new template."
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
