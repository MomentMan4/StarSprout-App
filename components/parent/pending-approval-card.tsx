"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { approveQuestAction, rejectQuestAction } from "@/app/actions/quest-actions"
import { useRouter } from "next/navigation"

const REJECTION_REASONS = [
  "Let's try again - take a bit more time",
  "Almost there - just needs a little more effort",
  "Good start - can you add a bit more?",
  "Great try - let's review together",
]

export function PendingApprovalCard({ task, parentId }: { task: any; parentId: string }) {
  const router = useRouter()
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [selectedReason, setSelectedReason] = useState(REJECTION_REASONS[0])
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    setLoading(true)
    try {
      await approveQuestAction(task.id, parentId)

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([50, 100, 50])
      }

      router.refresh()
    } catch (error) {
      console.error("Error approving quest:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    try {
      await rejectQuestAction(task.id, parentId, selectedReason)

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(100)
      }

      setShowRejectDialog(false)
      router.refresh()
    } catch (error) {
      console.error("Error rejecting quest:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-start justify-between p-4 rounded-lg border border-orange-200 bg-orange-50">
        <div className="flex-1">
          <p className="font-medium">{task.title}</p>
          <p className="text-sm text-muted-foreground">
            {task.assigned_to_user?.nickname} • {task.points} points • {task.category}
          </p>
          {task.reflection_text && (
            <div className="mt-2 p-3 rounded bg-white/50 border">
              <p className="text-xs font-medium text-muted-foreground mb-1">Reflection:</p>
              <p className="text-sm italic">"{task.reflection_text}"</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Submitted: {new Date(task.submitted_at).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2 ml-4">
          <Button size="sm" onClick={handleApprove} disabled={loading} className="bg-green-500 hover:bg-green-600">
            <Check className="mr-1 h-4 w-4" />
            Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowRejectDialog(true)} disabled={loading}>
            <X className="mr-1 h-4 w-4" />
            Needs Work
          </Button>
        </div>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quest Needs More Work</DialogTitle>
            <DialogDescription>Choose a gentle message to send to {task.assigned_to_user?.nickname}</DialogDescription>
          </DialogHeader>

          <RadioGroup value={selectedReason} onValueChange={setSelectedReason} className="space-y-3">
            {REJECTION_REASONS.map((reason) => (
              <div key={reason} className="flex items-center space-x-2">
                <RadioGroupItem value={reason} id={reason} />
                <Label htmlFor={reason} className="font-normal cursor-pointer">
                  {reason}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleReject} disabled={loading}>
              {loading ? "Sending..." : "Send Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
