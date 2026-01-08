"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Search, FileText, Star, Eye } from "lucide-react"
import { createGlobalTemplateAction, updateGlobalTemplateAction } from "@/app/actions/admin-template-actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EmptyState } from "@/components/ui/empty-state"

interface QuestTemplatesClientProps {
  templates: any[]
}

export function QuestTemplatesClient({ templates }: QuestTemplatesClientProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [activeFilter, setActiveFilter] = useState("all")
  const [isCreating, setIsCreating] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: "deactivate" | "activate"
    template: any
  } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    suggested_points: 10,
    icon_emoji: "📝",
    is_active: true,
  })

  const categories = [
    "Morning Routine",
    "Homework",
    "Chores",
    "Physical Activity",
    "Reading",
    "Kindness",
    "Learning",
    "Creative",
    "Health",
    "Other",
  ]

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter
    const matchesActive =
      activeFilter === "all" ||
      (activeFilter === "active" && !template.is_archived) ||
      (activeFilter === "inactive" && template.is_archived)
    return matchesSearch && matchesCategory && matchesActive
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    const action = selectedTemplate
      ? updateGlobalTemplateAction(selectedTemplate.id, formData)
      : createGlobalTemplateAction(formData)

    const result = await action
    setIsCreating(false)

    if (result.success) {
      toast.success(selectedTemplate ? "Template updated successfully" : "Template created successfully")
      setFormData({
        title: "",
        description: "",
        category: "",
        suggested_points: 10,
        icon_emoji: "📝",
        is_active: true,
      })
      setSelectedTemplate(null)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to save template")
    }
  }

  const handleEdit = (template: any) => {
    setSelectedTemplate(template)
    setFormData({
      title: template.title,
      description: template.description || "",
      category: template.category,
      suggested_points: template.suggested_points,
      icon_emoji: template.icon_emoji || "📝",
      is_active: !template.is_archived,
    })
  }

  const handlePreview = (template: any) => {
    setSelectedTemplate(template)
    setShowPreview(true)
  }

  const handleToggleStatus = async (template: any, newStatus: boolean) => {
    setConfirmAction({
      type: newStatus ? "activate" : "deactivate",
      template,
    })
  }

  const executeStatusToggle = async () => {
    if (!confirmAction) return

    const result = await updateGlobalTemplateAction(confirmAction.template.id, {
      ...confirmAction.template,
      is_active: confirmAction.type === "activate",
    })

    if (result.success) {
      toast.success(`Template ${confirmAction.type === "activate" ? "activated" : "deactivated"}`)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to update template")
    }

    setConfirmAction(null)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Template Dialog */}
      <Dialog
        open={!!selectedTemplate || isCreating}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTemplate(null)
            setFormData({
              title: "",
              description: "",
              category: "",
              suggested_points: 10,
              icon_emoji: "📝",
              is_active: true,
            })
          }
        }}
      >
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{selectedTemplate ? "Edit Template" : "Create New Template"}</DialogTitle>
              <DialogDescription>
                {selectedTemplate
                  ? "Update the system quest template"
                  : "Create a new quest template available to all households"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Make Your Bed"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description of the quest"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Suggested Points *</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.suggested_points}
                    onChange={(e) =>
                      setFormData({ ...formData, suggested_points: Number.parseInt(e.target.value) || 10 })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Icon/Emoji</Label>
                <Input
                  value={formData.icon_emoji}
                  onChange={(e) => setFormData({ ...formData, icon_emoji: e.target.value })}
                  placeholder="📝"
                  maxLength={2}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active (visible to households)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedTemplate(null)
                  setFormData({
                    title: "",
                    description: "",
                    category: "",
                    suggested_points: 10,
                    icon_emoji: "📝",
                    is_active: true,
                  })
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || !formData.title || !formData.category}>
                {isCreating ? "Saving..." : selectedTemplate ? "Update Template" : "Create Template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Templates ({filteredTemplates.length})</CardTitle>
          <CardDescription>Global quest templates available to all households</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTemplates.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No templates found"
              description="Try adjusting your search filters or create a new template"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Icon</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="text-2xl">{template.icon_emoji || "📝"}</TableCell>
                    <TableCell className="font-medium">{template.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{template.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-yellow-500">
                        <Star className="h-3 w-3 mr-1" />
                        {template.suggested_points}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.is_archived ? "outline" : "default"}>
                        {template.is_archived ? "Inactive" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handlePreview(template)}>
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(template)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(template, !template.is_archived)}
                      >
                        {template.is_archived ? "Activate" : "Deactivate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kid UI Preview</DialogTitle>
            <DialogDescription>How this quest will appear to children</DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="py-4">
              {/* Simplified quest card preview */}
              <Card className="border-2 border-indigo-300 bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-4xl border-2 border-indigo-200">
                      {selectedTemplate.icon_emoji || "📝"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-black text-gray-900 mb-1 leading-tight">{selectedTemplate.title}</h3>
                      {selectedTemplate.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{selectedTemplate.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="text-base px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold">
                          <Star className="h-4 w-4 mr-1" />
                          {selectedTemplate.suggested_points}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {selectedTemplate.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    className="w-full h-14 text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-500"
                  >
                    I Did It! ✓
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowPreview(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Status Changes */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm Template {confirmAction?.type === "activate" ? "Activation" : "Deactivation"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "activate"
                ? `This will make "${confirmAction?.template.title}" visible to all households. Children will be able to see and use this template.`
                : `This will hide "${confirmAction?.template.title}" from all households. Existing assigned quests will remain, but parents won't be able to assign new ones from this template.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeStatusToggle}>
              Confirm {confirmAction?.type === "activate" ? "Activation" : "Deactivation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
