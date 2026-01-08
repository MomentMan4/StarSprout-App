"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, RefreshCw, Sparkles, BarChart } from "lucide-react"
import { regenerateInviteCodeAction, triggerJobAction } from "@/app/actions/admin-actions"
import { toast } from "sonner"
import type { User } from "@/lib/db/types"

interface Props {
  householdId: string
  children: User[]
}

export function HouseholdDetailClient({ householdId, children }: Props) {
  const [selectedChild, setSelectedChild] = useState<string>("")
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    action: string
    title: string
    description: string
    onConfirm: () => Promise<void>
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleRegenerateInviteCode = async () => {
    if (!selectedChild) return

    setConfirmDialog({
      open: true,
      action: "regenerate_invite",
      title: "Regenerate Invite Code",
      description:
        "This will invalidate the old invite code and generate a new one. The child can share the new code with friends.",
      onConfirm: async () => {
        setIsLoading(true)
        try {
          const result = await regenerateInviteCodeAction(selectedChild)
          if (result.success) {
            toast.success("Invite code regenerated successfully")
          } else {
            toast.error(result.error || "Failed to regenerate invite code")
          }
        } catch (error) {
          toast.error("An error occurred")
        } finally {
          setIsLoading(false)
          setConfirmDialog(null)
        }
      },
    })
  }

  const handleTriggerJob = async (jobType: "leaderboard" | "streaks" | "weekly_summary") => {
    const jobTitles = {
      leaderboard: "Recompute Leaderboard",
      streaks: "Recompute Streaks",
      weekly_summary: "Regenerate Weekly Summary",
    }

    const jobDescriptions = {
      leaderboard: "This will recalculate leaderboard rankings for this household's children.",
      streaks: "This will recompute streak data for all children in this household.",
      weekly_summary: "This will regenerate the weekly summary report (AI generation disabled for safety).",
    }

    setConfirmDialog({
      open: true,
      action: jobType,
      title: jobTitles[jobType],
      description: jobDescriptions[jobType],
      onConfirm: async () => {
        setIsLoading(true)
        try {
          const result = await triggerJobAction(householdId, jobType)
          if (result.success) {
            toast.success(`${jobTitles[jobType]} job triggered successfully`)
          } else {
            toast.error(result.error || "Failed to trigger job")
          }
        } catch (error) {
          toast.error("An error occurred")
        } finally {
          setIsLoading(false)
          setConfirmDialog(null)
        }
      },
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span>All actions are logged and require confirmation</span>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Regenerate Invite Code */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Regenerate Child Invite Code</label>
              <Select value={selectedChild} onValueChange={setSelectedChild}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a child" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.nickname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleRegenerateInviteCode} disabled={!selectedChild || isLoading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
          </div>

          {/* Job Triggers */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Trigger Background Jobs</label>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => handleTriggerJob("leaderboard")} disabled={isLoading}>
                <BarChart className="mr-2 h-4 w-4" />
                Recompute Leaderboard
              </Button>
              <Button variant="outline" onClick={() => handleTriggerJob("streaks")} disabled={isLoading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Recompute Streaks
              </Button>
              <Button variant="outline" onClick={() => handleTriggerJob("weekly_summary")} disabled={isLoading}>
                <Sparkles className="mr-2 h-4 w-4" />
                Regenerate Weekly Summary
              </Button>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-md text-sm">
            <p className="font-medium mb-1">Rate Limiting</p>
            <p className="text-muted-foreground text-xs">
              Job triggers are rate-limited to 5 per hour per household to prevent abuse and system overload.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmDialog.title}</DialogTitle>
              <DialogDescription>{confirmDialog.description}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialog(null)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={confirmDialog.onConfirm} disabled={isLoading}>
                {isLoading ? "Processing..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
