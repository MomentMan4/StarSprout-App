"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { QuestTemplate, User } from "@/lib/db/types"

const CATEGORIES = ["All", "Health", "Learning", "Chores", "Creative", "Social", "Habits"]

export function QuestTemplateGrid({
  templates,
  children,
  parentId,
}: {
  templates: QuestTemplate[]
  children: User[]
  parentId: string
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "All" || template.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quest Templates</CardTitle>
        <CardDescription>Pre-made quest templates to quickly assign to children</CardDescription>

        <div className="flex gap-3 pt-4">
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTemplates.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="p-4 rounded-lg border hover:border-indigo-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">
                      {template.icon_emoji} {template.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {template.suggested_points} pts
                      </Badge>
                      {template.is_system_template && (
                        <Badge variant="outline" className="text-xs bg-blue-50">
                          System
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No templates found</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
