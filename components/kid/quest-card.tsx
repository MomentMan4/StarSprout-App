"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Star } from "lucide-react"
import { submitTask } from "@/app/actions/quest-actions"
import { haptic } from "@/lib/utils/haptics"
import { useRouter } from "next/navigation"

interface QuestCardProps {
  quest: any
  onSubmit: (quest: any) => void
}

export function QuestCard({ quest, onSubmit }: QuestCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const router = useRouter()

  const handleSubmit = async () => {
    setIsSubmitting(true)
    haptic("medium")

    const result = await submitTask(quest.id)

    if (result.success) {
      setShowCelebration(true)
      haptic("success")

      setTimeout(() => {
        onSubmit(quest)
        router.refresh()
      }, 800)
    } else {
      setIsSubmitting(false)
      haptic("error")
    }
  }

  return (
    <motion.div whileTap={{ scale: 0.98 }} className="relative">
      <Card className="border-2 border-indigo-300 bg-gradient-to-r from-indigo-50 to-purple-50 hover:border-indigo-400 transition-all shadow-md hover:shadow-lg overflow-hidden">
        {showCelebration && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 2, opacity: [0, 1, 0] }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
          >
            <div className="text-8xl">✨</div>
          </motion.div>
        )}

        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-4xl border-2 border-indigo-200">
              {quest.icon_emoji || "📝"}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-black text-gray-900 mb-1 leading-tight">{quest.title}</h3>
              {quest.description && <p className="text-sm text-gray-600 mb-2 line-clamp-2">{quest.description}</p>}
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="text-base px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold">
                  <Star className="h-4 w-4 mr-1" />
                  {quest.points}
                </Badge>
                {quest.category && (
                  <Badge variant="secondary" className="text-xs">
                    {quest.category}
                  </Badge>
                )}
                {quest.due_at && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(quest.due_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            size="lg"
            className="w-full h-14 text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg"
          >
            {isSubmitting ? "Sending..." : "I Did It! ✓"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
