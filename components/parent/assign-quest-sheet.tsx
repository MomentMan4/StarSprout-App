"use client"

import type React from "react"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { assignQuestAction } from "@/app/actions/quest-actions"
import { useRouter } from "next/navigation"
import { haptics } from "@/lib/haptics"
import { motion } from "framer-motion"
import { sheetEnter } from "@/lib/motion"
import type { User, QuestTemplate } from "@/lib/db/types"

interface AssignQuestSheetProps {
  children: User[]
  templates: QuestTemplate[]
  parentId: string
}

const CATEGORIES = ["Health", "Learning", "Chores", "Creative", "Social", "Habits"]

export function AssignQuestSheet({ children, templates, parentId }: AssignQuestSheetProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedChildren, setSelectedChildren] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("Habits")
  const [points, setPoints] = useState("10")
  const [dueDate, setDueDate] = useState("")
  const [streakEligible, setStreakEligible] = useState(true)

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setSelectedTemplate(templateId)
      setTitle(template.title)
      setDescription(template.description || "")
      setCategory(template.category)
      setPoints(template.suggested_points.toString())
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedChildren.length === 0 || !title) return

    setLoading(true)

    try {
      const assignments = selectedChildren.map((childId) =>
        assignQuestAction({
          assignedTo: childId,
          assignedBy: parentId,
          templateId: selectedTemplate || null,
          title,
          description: description || null,
          category,
          points: Number.parseInt(points),
          dueDate: dueDate || null,
          streakEligible,
        }),
      )

      await Promise.all(assignments)

      haptics.success()

      setSelectedChildren([])
      setSelectedTemplate("")
      setTitle("")
      setDescription("")
      setCategory("Habits")
      setPoints("10")
      setDueDate("")
      setStreakEligible(true)
      setOpen(false)

      router.refresh()
    } catch (error) {
      console.error("Error assigning quest:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleChild = (childId: string) => {
    setSelectedChildren((prev) => (prev.includes(childId) ? prev.filter((id) => id !== childId) : [...prev, childId]))
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Assign Quest
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <motion.div initial="hidden" animate="visible" variants={sheetEnter}>
          <SheetHeader>
            <SheetTitle>Assign a Quest</SheetTitle>
            <SheetDescription>Create a new quest for your child(ren) to complete</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Assign to Children *</Label>
              <div className="space-y-2 border rounded-lg p-3">
                {children.map((child) => (
                  <div key={child.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`child-${child.id}`}
                      checked={selectedChildren.includes(child.id)}
                      onCheckedChange={() => toggleChild(child.id)}
                    />
                    <Label htmlFor={`child-${child.id}`} className="flex-1 cursor-pointer font-normal">
                      {child.nickname}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedChildren.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  Quest will be assigned to {selectedChildren.length} children
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Use Template (Optional)</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger id="template" className="w-full">
                  <SelectValue placeholder="Start from template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.slice(0, 20).map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.icon_emoji} {template.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Quest Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Make your bed"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details about the quest..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
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

              <div className="space-y-2">
                <Label htmlFor="points">Points</Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  max="100"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date (Optional)</Label>
              <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="streak"
                checked={streakEligible}
                onCheckedChange={(checked) => setStreakEligible(!!checked)}
              />
              <Label htmlFor="streak" className="text-sm font-normal">
                Count towards streak
              </Label>
            </div>

            <SheetFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || selectedChildren.length === 0 || !title}>
                {loading ? "Assigning..." : "Assign Quest"}
              </Button>
            </SheetFooter>
          </form>
        </motion.div>
      </SheetContent>
    </Sheet>
  )
}
