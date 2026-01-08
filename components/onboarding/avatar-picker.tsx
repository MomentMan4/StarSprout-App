"use client"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const AVATARS = [
  "🦁",
  "🐯",
  "🐻",
  "🐼",
  "🐨",
  "🐸",
  "🦊",
  "🐰",
  "🐹",
  "🐵",
  "🦄",
  "🐲",
  "🦖",
  "🦕",
  "🐙",
  "🦋",
  "🐝",
  "🐞",
  "🌟",
  "⭐",
  "✨",
  "💫",
  "🌈",
  "🎨",
]

interface AvatarPickerProps {
  value: string | null
  onChange: (emoji: string) => void
}

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  return (
    <div className="grid gap-3">
      <Label>Choose an Avatar</Label>
      <div className="grid grid-cols-6 gap-2">
        {AVATARS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-lg border-2 text-2xl transition-all hover:scale-110",
              value === emoji ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-gray-300",
            )}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
