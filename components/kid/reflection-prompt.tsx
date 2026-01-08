"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { haptic } from "@/lib/utils/haptics"

interface ReflectionPromptProps {
  quest: any
  childNickname: string
  ageBand: string
  onComplete: () => void
  onSkip: () => void
}

const EMOJI_REACTIONS = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😎", label: "Cool" },
  { emoji: "🤩", label: "Excited" },
  { emoji: "😌", label: "Peaceful" },
  { emoji: "💪", label: "Strong" },
]

const QUICK_REFLECTIONS = [
  "It was fun!",
  "It was easy",
  "It was hard but I did it",
  "I'm proud of myself",
  "I want to do it again",
]

export function ReflectionPrompt({ quest, childNickname, ageBand, onComplete, onSkip }: ReflectionPromptProps) {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null)
  const [selectedReflection, setSelectedReflection] = useState<string | null>(null)

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji)
    haptic("light")
  }

  const handleReflectionSelect = (reflection: string) => {
    setSelectedReflection(reflection)
    haptic("light")
  }

  const handleSubmit = () => {
    haptic("success")
    onComplete()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onSkip}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-purple-300 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold">How did that feel? ✨</CardTitle>
              <Button variant="ghost" size="icon" onClick={onSkip}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Emoji Reaction */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Pick an emoji:</p>
              <div className="flex gap-2 justify-center">
                {EMOJI_REACTIONS.map((reaction) => (
                  <motion.button
                    key={reaction.emoji}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEmojiSelect(reaction.emoji)}
                    className={`w-14 h-14 rounded-full text-3xl transition-all ${
                      selectedEmoji === reaction.emoji
                        ? "bg-purple-200 ring-4 ring-purple-400"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {reaction.emoji}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Quick Reflection */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">What do you think?</p>
              <div className="space-y-2">
                {QUICK_REFLECTIONS.map((reflection) => (
                  <Button
                    key={reflection}
                    variant={selectedReflection === reflection ? "default" : "outline"}
                    className="w-full justify-start text-left"
                    onClick={() => handleReflectionSelect(reflection)}
                  >
                    {reflection}
                  </Button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onSkip} className="flex-1">
                Skip
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedEmoji && !selectedReflection}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Done! →
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
