"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"

interface CompanionWorldProps {
  streak: number
  completionRate: number
}

export function CompanionWorld({ streak, completionRate }: CompanionWorldProps) {
  const getCompanionStage = () => {
    if (streak >= 30) return { emoji: "🌳", bg: "from-green-200 to-emerald-300", text: "Mighty Oak!" }
    if (streak >= 14) return { emoji: "🌲", bg: "from-green-100 to-emerald-200", text: "Growing Tree!" }
    if (streak >= 7) return { emoji: "🌿", bg: "from-lime-100 to-green-200", text: "Sprout!" }
    if (streak >= 3) return { emoji: "🌱", bg: "from-yellow-100 to-lime-100", text: "Seedling!" }
    return { emoji: "🌰", bg: "from-amber-100 to-yellow-100", text: "Seed!" }
  }

  const stage = getCompanionStage()

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="mb-6"
    >
      <Card className={`border-2 border-green-300 bg-gradient-to-br ${stage.bg} overflow-hidden`}>
        <CardContent className="p-6 text-center">
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              repeatDelay: 1,
            }}
            className="text-6xl mb-2"
          >
            {stage.emoji}
          </motion.div>
          <h3 className="text-xl font-black text-green-900 mb-1">{stage.text}</h3>
          <p className="text-sm text-green-700 font-medium">Keep going to grow your StarSprout!</p>
          <div className="mt-3 flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < Math.min(5, Math.floor(streak / 7)) ? "bg-green-600" : "bg-green-300"
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
