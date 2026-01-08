"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Stepper } from "@/components/onboarding/stepper"
import { AvatarPicker } from "@/components/onboarding/avatar-picker"
import { Sparkles } from "lucide-react"
import { haptics } from "@/lib/haptics"
import { cn } from "@/lib/utils"

const STEPS = ["Household", "First Child", "Consent", "First Quest"]
const STARTER_QUESTS = [
  { title: "Make Your Bed", category: "chores", points: 10, emoji: "🛏️" },
  { title: "Brush Teeth", category: "hygiene", points: 5, emoji: "🪥" },
  { title: "Do Homework", category: "homework", points: 15, emoji: "📚" },
  { title: "Help with Dishes", category: "chores", points: 10, emoji: "🍽️" },
]

export default function ParentOnboardingPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { user, isLoaded } = useUser()

  // Form state
  const [householdName, setHouseholdName] = useState("")
  const [childNickname, setChildNickname] = useState("")
  const [childAvatar, setChildAvatar] = useState<string | null>(null)
  const [childAgeBand, setChildAgeBand] = useState<string>("")
  const [consentCoppa, setConsentCoppa] = useState(false)
  const [consentAI, setConsentAI] = useState(true)
  const [consentSocial, setConsentSocial] = useState(true)
  const [selectedQuest, setSelectedQuest] = useState(0)

  useEffect(() => {
    if (isLoaded) {
      checkOnboardingStatus()
    }
  }, [isLoaded, user])

  async function checkOnboardingStatus() {
    if (!user) {
      router.push("/sign-in")
      return
    }

    const metadata = user.publicMetadata as { setup_complete?: boolean; role?: string }
    if (metadata.setup_complete) {
      router.push("/parent/dashboard")
      return
    }

    setLoading(false)
  }

  function handleNext() {
    setError(null)

    // Validation for each step
    if (step === 1 && !householdName.trim()) {
      setError("Please enter a household name")
      return
    }

    if (step === 2) {
      if (!childNickname.trim()) {
        setError("Please enter a nickname for your child")
        return
      }
      if (!childAgeBand) {
        setError("Please select an age band")
        return
      }
    }

    if (step === 3 && !consentCoppa) {
      setError("Parent consent is required to continue")
      return
    }

    haptics.success()

    setStep(step + 1)
  }

  function handleBack() {
    setError(null)
    setStep(step - 1)
  }

  async function handleComplete() {
    setError(null)
    setSubmitting(true)

    if (!user) {
      setError("User not found")
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/onboarding/parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerk_user_id: user.id,
          household_name: householdName,
          parent_nickname: user.firstName || user.username || "Parent",
          child_nickname: childNickname,
          child_avatar: childAvatar,
          child_age_band: childAgeBand,
          consent_coppa: consentCoppa,
          consent_ai: consentAI,
          consent_social: consentSocial,
          starter_quest: STARTER_QUESTS[selectedQuest],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to complete onboarding")
      }

      haptics.celebration()

      router.push("/parent/dashboard")
    } catch (err: any) {
      console.error("[v0] Onboarding error:", err)
      setError(err.message || "Failed to complete onboarding")
      setSubmitting(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col gap-6">
          <div className="text-center mb-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-8 w-8 text-indigo-600" />
              <h1 className="text-4xl font-bold text-indigo-600">Welcome to StarSprout</h1>
            </div>
            <p className="text-sm text-muted-foreground">Let's set up your family in just a few steps</p>
          </div>

          <Stepper steps={STEPS} currentStep={step} />

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
            >
              {step === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Create Your Household</CardTitle>
                    <CardDescription>Give your family a fun name</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="household">Household Name</Label>
                        <Input
                          id="household"
                          placeholder="The Smith Family"
                          value={householdName}
                          onChange={(e) => setHouseholdName(e.target.value)}
                          autoFocus
                        />
                      </div>
                      {error && <p className="text-sm text-red-500">{error}</p>}
                      <Button onClick={handleNext} className="w-full">
                        Next
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Add Your First Child</CardTitle>
                    <CardDescription>We'll create their StarSprout profile</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      <div className="grid gap-2">
                        <Label htmlFor="nickname">Child's Nickname</Label>
                        <Input
                          id="nickname"
                          placeholder="Alex"
                          value={childNickname}
                          onChange={(e) => setChildNickname(e.target.value)}
                          autoFocus
                        />
                      </div>

                      <AvatarPicker value={childAvatar} onChange={setChildAvatar} />

                      <div className="grid gap-2">
                        <Label htmlFor="age-band">Age Band</Label>
                        <Select value={childAgeBand} onValueChange={setChildAgeBand}>
                          <SelectTrigger id="age-band">
                            <SelectValue placeholder="Select age" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="early_child">5-7 years</SelectItem>
                            <SelectItem value="mid_child">8-10 years</SelectItem>
                            <SelectItem value="pre_teen">11-13 years</SelectItem>
                            <SelectItem value="teen">14-16 years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {error && <p className="text-sm text-red-500">{error}</p>}

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleBack} className="w-full bg-transparent">
                          Back
                        </Button>
                        <Button onClick={handleNext} className="w-full">
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Privacy & Consent</CardTitle>
                    <CardDescription>Your trust is our top priority</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="coppa"
                          checked={consentCoppa}
                          onCheckedChange={(checked) => setConsentCoppa(checked === true)}
                        />
                        <div className="space-y-1 leading-none">
                          <Label
                            htmlFor="coppa"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            I confirm I am a parent or guardian (Required)
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            I have authority to create accounts for my children and consent to their use of StarSprout.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="ai"
                          checked={consentAI}
                          onCheckedChange={(checked) => setConsentAI(checked === true)}
                        />
                        <div className="space-y-1 leading-none">
                          <Label
                            htmlFor="ai"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Enable AI features (Optional)
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            AI-powered motivations and insights. All data is anonymized and never shared.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="social"
                          checked={consentSocial}
                          onCheckedChange={(checked) => setConsentSocial(checked === true)}
                        />
                        <div className="space-y-1 leading-none">
                          <Label
                            htmlFor="social"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Enable social features (Optional)
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Friends-only leaderboards. Parent approval required for all connections.
                          </p>
                        </div>
                      </div>

                      {error && <p className="text-sm text-red-500">{error}</p>}

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleBack} className="w-full bg-transparent">
                          Back
                        </Button>
                        <Button onClick={handleNext} className="w-full">
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === 4 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Assign First Quest</CardTitle>
                    <CardDescription>Pick a starter quest for {childNickname}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      <div className="grid grid-cols-1 gap-3">
                        {STARTER_QUESTS.map((quest, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setSelectedQuest(index)}
                            className={cn(
                              "flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-all hover:bg-gray-50",
                              selectedQuest === index ? "border-indigo-600 bg-indigo-50" : "border-gray-200",
                            )}
                          >
                            <span className="text-3xl">{quest.emoji}</span>
                            <div className="flex-1">
                              <p className="font-medium">{quest.title}</p>
                              <p className="text-sm text-muted-foreground">{quest.points} points</p>
                            </div>
                          </button>
                        ))}
                      </div>

                      {error && <p className="text-sm text-red-500">{error}</p>}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={handleBack}
                          className="w-full bg-transparent"
                          disabled={submitting}
                        >
                          Back
                        </Button>
                        <Button onClick={handleComplete} className="w-full" disabled={submitting}>
                          {submitting ? "Setting up..." : "Complete Setup"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
