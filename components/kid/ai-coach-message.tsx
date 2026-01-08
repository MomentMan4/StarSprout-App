"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

interface AICoachMessageProps {
  message: string
  onDismiss: () => void
}

export function AICoachMessage({ message, onDismiss }: AICoachMessageProps) {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
    >
      <Card className="border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-2xl">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-orange-600 mb-1">Your Coach</p>
            <p className="text-sm font-medium text-gray-900">{message}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
