"use client"

import { AlertDialogAction } from "@/components/ui/alert-dialog"

import { AlertDialogCancel } from "@/components/ui/alert-dialog"

import { AlertDialogFooter } from "@/components/ui/alert-dialog"

import { AlertDialogDescription } from "@/components/ui/alert-dialog"

import { AlertDialogTitle } from "@/components/ui/alert-dialog"

import { AlertDialogHeader } from "@/components/ui/alert-dialog"

import { AlertDialogContent } from "@/components/ui/alert-dialog"

import { AlertDialog } from "@/components/ui/alert-dialog"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge as BadgeUI } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Award, Plus, Pencil, Eye, AlertTriangle, Trash } from "lucide-react"
import { createBadge, updateBadge, deleteBadge } from "@/app/actions/admin-badge-actions"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"

interface Badge {
  id: string
  badge_key: string
  title: string
  description: string | null
  category: string
  award_criteria: any
  icon_emoji?: string
  is_active?: boolean
  award_count?: number
}

export function BadgesManagementClient({ badges }: { badges: Badge[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null)
  const [previewBadge, setPreviewBadge] = useState<Badge | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Badge | null>(null)

  // Filter badges
  const filteredBadges = badges.filter((badge) => {
    const matchesSearch =
      badge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      badge.badge_key.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || badge.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(badges.map((b) => b.category)))

  const handleDelete = async (badgeId: string) => {
    setIsLoading(true)
    try {
      await deleteBadge(badgeId)
      window.location.reload()
    } catch (error) {
      console.error("[v0] Error deleting badge:", error)
    } finally {
      setIsLoading(false)
      setConfirmDelete(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Search badges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
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

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Badge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <BadgeForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Badges ({filteredBadges.length})</CardTitle>
          <CardDescription>Manage badge catalog for the gamification system</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSkeleton count={5} height={80} />
          ) : filteredBadges.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Award className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>No badges found</EmptyTitle>
                <EmptyDescription>
                  Try adjusting your search filters or create a new badge to get started
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Badge</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Criteria</TableHead>
                  <TableHead className="text-right">Awarded</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBadges.map((badge) => (
                  <TableRow key={badge.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{badge.icon_emoji || "🏆"}</span>
                        <div>
                          <div className="font-medium">{badge.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{badge.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{badge.badge_key}</TableCell>
                    <TableCell>
                      <BadgeUI variant="outline">{badge.category}</BadgeUI>
                    </TableCell>
                    <TableCell className="text-xs">
                      {badge.award_criteria?.quests_completed && `${badge.award_criteria.quests_completed} quests`}
                      {badge.award_criteria?.streak_days && `${badge.award_criteria.streak_days} day streak`}
                      {badge.award_criteria?.category &&
                        `${badge.award_criteria.count} ${badge.award_criteria.category}`}
                    </TableCell>
                    <TableCell className="text-right">{badge.award_count || 0}</TableCell>
                    <TableCell>
                      {badge.is_active !== false ? (
                        <BadgeUI variant="default">Active</BadgeUI>
                      ) : (
                        <BadgeUI variant="secondary">Inactive</BadgeUI>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setPreviewBadge(badge)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setEditingBadge(badge)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <BadgeForm badge={badge} onSuccess={() => setEditingBadge(null)} />
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(badge)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!previewBadge} onOpenChange={() => setPreviewBadge(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Badge Preview</DialogTitle>
            <DialogDescription>How this badge appears to kids when awarded</DialogDescription>
          </DialogHeader>
          {previewBadge && (
            <div className="p-8 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg">
              <div className="text-center space-y-4">
                <div className="text-6xl animate-bounce">{previewBadge.icon_emoji || "🏆"}</div>
                <h3 className="text-2xl font-bold">{previewBadge.title}</h3>
                <p className="text-muted-foreground">{previewBadge.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the badge.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(confirmDelete?.id || "")}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function BadgeForm({ badge, onSuccess }: { badge?: Badge; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [badgeKey, setBadgeKey] = useState(badge?.badge_key || "")
  const [title, setTitle] = useState(badge?.title || "")
  const [description, setDescription] = useState(badge?.description || "")
  const [category, setCategory] = useState(badge?.category || "milestone")
  const [iconEmoji, setIconEmoji] = useState(badge?.icon_emoji || "🏆")
  const [thresholdType, setThresholdType] = useState(
    badge?.award_criteria?.quests_completed
      ? "quests_completed"
      : badge?.award_criteria?.streak_days
        ? "streak_days"
        : badge?.award_criteria?.category
          ? "category_streak"
          : "quests_completed",
  )
  const [thresholdValue, setThresholdValue] = useState(
    badge?.award_criteria?.quests_completed || badge?.award_criteria?.streak_days || badge?.award_criteria?.count || 1,
  )
  const [categoryValue, setCategoryValue] = useState(badge?.award_criteria?.category || "")
  const [isActive, setIsActive] = useState(badge?.is_active !== false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Build criteria JSON
      const criteria: any = {}
      if (thresholdType === "quests_completed") {
        criteria.quests_completed = thresholdValue
      } else if (thresholdType === "streak_days") {
        criteria.streak_days = thresholdValue
      } else if (thresholdType === "category_streak") {
        criteria.category = categoryValue
        criteria.count = thresholdValue
      }

      const data = {
        badge_key: badgeKey,
        title,
        description,
        category,
        icon_emoji: iconEmoji,
        award_criteria: criteria,
        is_active: isActive,
      }

      if (badge) {
        await updateBadge(badge.id, data)
      } else {
        await createBadge(data)
      }

      onSuccess()
      window.location.reload()
    } catch (error) {
      console.error("[v0] Error saving badge:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{badge ? "Edit Badge" : "Create Badge"}</DialogTitle>
        <DialogDescription>{badge ? "Update badge properties" : "Create a new system badge"}</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <Label htmlFor="badge-key">
            Badge Key {badge && <span className="text-xs text-muted-foreground">(immutable)</span>}
          </Label>
          <Input
            id="badge-key"
            value={badgeKey}
            onChange={(e) => setBadgeKey(e.target.value)}
            disabled={!!badge}
            required
            placeholder="first_quest"
          />
          {badge && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Badge keys cannot be changed after creation
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="First Quest Complete"
            />
          </div>

          <div>
            <Label htmlFor="icon">Icon Emoji</Label>
            <Input
              id="icon"
              value={iconEmoji}
              onChange={(e) => setIconEmoji(e.target.value)}
              required
              placeholder="🏆"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Completed your very first quest!"
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="first_quest">First Quest</SelectItem>
              <SelectItem value="milestone">Milestone</SelectItem>
              <SelectItem value="streak">Streak</SelectItem>
              <SelectItem value="special">Special</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="threshold-type">Award Criteria</Label>
            <Select value={thresholdType} onValueChange={setThresholdType}>
              <SelectTrigger id="threshold-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quests_completed">Quests Completed</SelectItem>
                <SelectItem value="streak_days">Streak Days</SelectItem>
                <SelectItem value="category_streak">Category Streak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="threshold-value">Threshold Value</Label>
            <Input
              id="threshold-value"
              type="number"
              min="1"
              value={thresholdValue}
              onChange={(e) => setThresholdValue(Number.parseInt(e.target.value))}
              required
            />
          </div>
        </div>

        {thresholdType === "category_streak" && (
          <div>
            <Label htmlFor="category-value">Category</Label>
            <Select value={categoryValue} onValueChange={setCategoryValue}>
              <SelectTrigger id="category-value">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chores">Chores</SelectItem>
                <SelectItem value="homework">Homework</SelectItem>
                <SelectItem value="kindness">Kindness</SelectItem>
                <SelectItem value="hygiene">Hygiene</SelectItem>
                <SelectItem value="exercise">Exercise</SelectItem>
                <SelectItem value="creativity">Creativity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
          <Label htmlFor="active">Badge is active</Label>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : badge ? "Update Badge" : "Create Badge"}
          </Button>
        </div>
      </div>
    </form>
  )
}
