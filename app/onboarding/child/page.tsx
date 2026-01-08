"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Suspense } from "react"
import { motion } from "framer-motion"
import { haptics } from "@/lib/haptics"
import { fadeIn, cardPress } from "@/lib/motion"

function ChildOnboardingForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const [nickname, setNickname] = useState("")
  const [ageBand, setAgeBand] = useState<string>("")
  const [joinCode, setJoinCode] = useState("")

  const supabase = createClient()

  useEffect(() => {
    // Pre-fill join code from URL if present
    const code = searchParams.get("code")
    if (code) {
      setJoinCode(code)
    }
  }, [searchParams])

  async function handleComplete() {
    setError(null)

    if (!nickname.trim() || !ageBand || !joinCode.trim()) {
      setError("Please fill in all fields")
      return
    }

    setLoading(true)
    haptics.tap()

    try {
      // In a real implementation with Clerk, children would be created by parents
      // and given pre-authorized credentials or magic links
      // For now, we'll show a friendly message
      setError("Child accounts must be created by a parent. Please ask your parent to add you from their dashboard.")
      setLoading(false)
    } catch (err: any) {
      console.error("[v0] Child onboarding error:", err)
      setError(err.message || "Failed to complete setup")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="w-full max-w-lg">
        <motion.div className="flex flex-col gap-6" variants={fadeIn} initial="hidden" animate="visible">
          <div className="text-center mb-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Join StarSprout!
            </h1>
            <p className="text-sm text-muted-foreground mt-2">Start your quest adventure</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Create Your Profile</CardTitle>
              <CardDescription>Tell us about yourself to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="nickname">Your Nickname</Label>
                  <Input
                    id="nickname"
                    placeholder="Alex"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="age-band">Your Age</Label>
                  <Select value={ageBand} onValueChange={setAgeBand}>
                    <SelectTrigger id="age-band">
                      <SelectValue placeholder="Select your age" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="early_child">5-7 years</SelectItem>
                      <SelectItem value="mid_child">8-10 years</SelectItem>
                      <SelectItem value="pre_teen">11-13 years</SelectItem>
                      <SelectItem value="teen">14-16 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="code">Family Code</Label>
                  <Input
                    id="code"
                    placeholder="Ask your parent for the code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-900">{error}</p>
                  </div>
                )}

                <motion.div variants={cardPress} whileTap="tap">
                  <Button onClick={handleComplete} className="w-full" disabled={loading}>
                    {loading ? "Joining..." : "Join Family"}
                  </Button>
                </motion.div>

                <p className="text-xs text-center text-muted-foreground">
                  Ask your parent to create an account for you from their dashboard
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default function ChildOnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <ChildOnboardingForm />
    </Suspense>
  )
}
