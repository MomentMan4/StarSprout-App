"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { submitTask } from "@/app/actions/quest-actions"

type Task = {
  id: string
  title: string
  description: string | null
  icon_emoji: string | null
  points: number
  category: string
  status: string
}

export function QuestDetailClient({ task }: { task: Task }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reflection, setReflection] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await submitTask(task.id, reflection || undefined)
      if (result.success) {
        // Haptic feedback on success
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(200)
        }
        router.push("/kid/home?success=submitted")
      }
    } catch (error) {
      console.error("Failed to submit quest:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (task.status !== "pending") {
    router.push("/kid/home")
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center px-4">
          <h1 className="text-2xl font-bold text-indigo-600">StarSprout</h1>
        </div>
      </header>

      <main className="container mx-auto flex-1 p-6 max-w-2xl">
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <div className="text-center mb-4">
              {task.icon_emoji && <div className="text-6xl mb-4">{task.icon_emoji}</div>}
              <CardTitle className="text-3xl mb-2">{task.title}</CardTitle>
              {task.description && <CardDescription className="text-lg">{task.description}</CardDescription>}
            </div>
            <div className="flex justify-center gap-4 pt-4">
              <div className="text-center p-4 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-900">Points</p>
                <p className="text-3xl font-bold text-yellow-900">{task.points}</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg">
                <p className="text-sm font-medium text-purple-900">Category</p>
                <p className="text-xl font-bold text-purple-900">{task.category}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                <h3 className="font-semibold text-lg mb-3">Did you complete this quest?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Tell us about it! Your parent will review and approve your work.
                </p>

                <div className="grid gap-2">
                  <Label htmlFor="reflection">How did it go? (Optional)</Label>
                  <Textarea
                    id="reflection"
                    name="reflection"
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="Tell us what you did and how it went..."
                    rows={4}
                    className="bg-white"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Go Back
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "I Did It!"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
