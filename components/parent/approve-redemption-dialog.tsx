"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { approveRedemption, rejectRedemption } from "@/app/actions/reward-actions"
import { haptic } from "@/lib/utils/haptics"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

interface ApproveRedemptionDialogProps {
  redemption: any
  onClose: () => void
}

export function ApproveRedemptionDialog({ redemption, onClose }: ApproveRedemptionDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const handleApprove = async () => {
    setIsProcessing(true)
    haptic("medium")

    const result = await approveRedemption(redemption.id)

    if (result.success) {
      haptic("success")
      router.refresh()
      onClose()
    } else {
      haptic("error")
    }

    setIsProcessing(false)
  }

  const handleReject = async () => {
    setIsProcessing(true)
    haptic("light")

    const result = await rejectRedemption(redemption.id)

    if (result.success) {
      router.refresh()
      onClose()
    } else {
      haptic("error")
    }

    setIsProcessing(false)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review Reward Request</DialogTitle>
          <DialogDescription>{redemption.child?.nickname} wants to redeem this reward</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/50">
            <span className="text-5xl">{redemption.reward?.icon_emoji || "🎁"}</span>
            <div className="flex-1">
              <h3 className="text-xl font-bold">{redemption.reward?.title}</h3>
              {redemption.reward?.description && (
                <p className="text-sm text-muted-foreground mt-1">{redemption.reward?.description}</p>
              )}
              <div className="flex gap-2 mt-2">
                <Badge>{redemption.points_spent} points</Badge>
                <Badge variant="secondary">Requested {new Date(redemption.requested_at).toLocaleDateString()}</Badge>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-900">
              <strong>Note:</strong> Approving will deduct {redemption.points_spent} points from{" "}
              {redemption.child?.nickname}'s balance.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReject} disabled={isProcessing} className="flex-1 bg-transparent">
            Reject
          </Button>
          <Button onClick={handleApprove} disabled={isProcessing} className="flex-1 bg-green-600 hover:bg-green-700">
            {isProcessing ? "Processing..." : "Approve & Fulfill"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
