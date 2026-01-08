"use client"

import type React from "react"

import { useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createRewardAction } from "@/app/actions/reward-actions"
import { haptic } from "@/lib/utils/haptics"
import { useRouter } from "next/navigation"

interface CreateRewardSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  householdId: string
  userId: string
}

const EMOJI_SUGGESTIONS = ["🎮", "🍕", "🎬", "📱", "🎨", "⚽", "🎵", "📚", "🍦", "🎁"]

export function CreateRewardSheet({ open, onOpenChange, householdId, userId }: CreateRewardSheetProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [pointsCost, setPointsCost] = useState(50)
  const [emoji, setEmoji] = useState("🎁")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    haptic("medium")

    const result = await createRewardAction({
      household_id: householdId,
      created_by: userId,
      title,
      description,
      points_cost: pointsCost,
      icon_emoji: emoji,
    })

    if (result.success) {
      haptic("success")
      setTitle("")
      setDescription("")
      setPointsCost(50)
      setEmoji("🎁")
      onOpenChange(false)
      router.refresh()
    } else {
      haptic("error")
    }

    setIsSubmitting(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create New Reward</SheetTitle>
          <SheetDescription>Add a reward that children can redeem with their points</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div>
            <Label htmlFor="emoji">Icon</Label>
            <div className="flex gap-2 mt-2">
              {EMOJI_SUGGESTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-12 h-12 text-2xl rounded-lg border-2 transition-all ${
                    emoji === e ? "border-indigo-500 bg-indigo-50 scale-110" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="title">Reward Name *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Extra Screen Time"
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this reward include?"
              className="mt-2"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="points">Points Cost *</Label>
            <Input
              id="points"
              type="number"
              value={pointsCost}
              onChange={(e) => setPointsCost(Number(e.target.value))}
              min={1}
              required
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">Typical quests award 5-20 points</p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title} className="flex-1">
              {isSubmitting ? "Creating..." : "Create Reward"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
