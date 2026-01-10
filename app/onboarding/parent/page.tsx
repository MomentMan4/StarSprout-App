"use client"

import { useEffect, useState, useRef } from "react"
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
import { Sparkles, AlertCircle } from "lucide-react"
import { haptics } from "@/lib/haptics"
import { cn } from "@/lib/utils"
import { completeParentOnboarding } from "@/app/actions/onboarding"
import { AuthErrorPanel } from "@/components/auth/auth-error-panel"
import { checkAuthHealth, getAuthHealthMessage } from "@/lib/auth/health"

const STEPS = ["Household", "First Child", "Consent", "First Quest"]
const STARTER_QUESTS = [
  { title: "Make Your Bed", category: "chores", points: 10, emoji: "🛏️" },
  { title: "Brush Teeth", category: "hygiene", points: 5, emoji: "🪥" },
  { title: "Do Homework", category: "homework", points: 15, emoji: "📚" },
  { title: "Help with Dishes", category: "chores", points: 10, emoji: "🍽️" },
]

const AUTH_LOADING_TIMEOUT = 8000

export default function ParentOnboardingPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<{ message: string; code?: string } | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authDiagnostic, setAuthDiagnostic] = useState<string | null>(null)
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Form state
  const [householdName, setHouseholdName] = useState("")
  const [childNickname, setChildNickname] = useState("")
  const [childAvatar, setChildAvatar] = useState<string | null>(null)
  const [childAgeBand, setChildAgeBand] = useState<string>("")
  const [consentCoppa, setConsentCoppa] = useState(false)
  const [consentAI, setConsentAI] = useState(false)
  const [consentSocial, setConsentSocial] = useState(false)
  const [selectedQuest, setSelectedQuest] = useState(0)

  useEffect(() => {
    console.log("[onboarding:redirect] Starting auth check, isLoaded:", isLoaded)

    // Set timeout for auth loading
    loadingTimeoutRef.current = setTimeout(() => {
      if (!isLoaded) {
        console.error("[auth:restore] Auth loading timeout after 8 seconds")
        const health = checkAuthHealth()
        setAuthError("Session couldn't be restored. Please refresh or sign in again.")
        setAuthDiagnostic(health.isHealthy ? undefined : getAuthHealthMessage(health))
        setLoading(false)
      }
    }, AUTH_LOADING_TIMEOUT)

    if (isLoaded) {
      // Clear timeout if auth loads successfully
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
      checkOnboardingStatus()
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [isLoaded, user])

  async function checkOnboardingStatus() {
    console.log("[onboarding:redirect] Checking onboarding status")

    if (!user) {
      console.log("[onboarding:redirect] No user, redirecting to sign-in")
      router.push("/sign-in")
      return
    }

    const metadata = user.publicMetadata as { setup_complete?: boolean; role?: string; app_user_id?: string }
    console.log("[onboarding:redirect] User metadata:", {
      setupComplete: metadata.setup_complete,
      role: metadata.role,
      appUserId: metadata.app_user_id,
    })

    if (metadata.setup_complete && metadata.app_user_id) {
      console.log("[onboarding:redirect] Onboarding already complete, redirecting to dashboard")
      router.push("/parent/dashboard")
      return
    }

    console.log("[onboarding:redirect] Onboarding not complete, showing form")
    setLoading(false)
  }

  function handleRetryAuth() {
    console.log("[auth:restore] Retrying auth check")
    setAuthError(null)
    setAuthDiagnostic(null)
    setLoading(true)
    window.location.reload()
  }

  function handleNext() {
    setError(null)

    // Validation for each step
    if (step === 1 && !householdName.trim()) {
      setError({ message: "Please enter a household name", code: "VALIDATION_ERROR" })
      return
    }

    if (step === 2) {
      if (!childNickname.trim()) {
        setError({ message: "Please enter a nickname for your child", code: "VALIDATION_ERROR" })
        return
      }
      if (!childAgeBand) {
        setError({ message: "Please select an age band", code: "VALIDATION_ERROR" })
        return
      }
    }

    if (step === 3 && !consentCoppa) {
      setError({ message: "Parent consent is required to continue", code: "VALIDATION_ERROR" })
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

    const effectiveUserId = user?.id || `preview_parent_${Date.now()}`
    const effectiveNickname = user?.firstName || user?.username || "Parent"

    console.log("[v0] Starting onboarding with user:", effectiveUserId)

    try {
      console.log("[v0] Calling server action")
      const result = await completeParentOnboarding({
        clerk_user_id: effectiveUserId,
        household_name: householdName,
        parent_nickname: effectiveNickname,
        child_nickname: childNickname,
        child_avatar: childAvatar,
        child_age_band: childAgeBand,
        consent_coppa: consentCoppa,
        consent_ai: consentAI,
        consent_social: consentSocial,
        starter_quest: STARTER_QUESTS[selectedQuest],
      })

      console.log("[v0] Server action result:", result)

      if (!result.ok) {
        console.error("[v0] Onboarding failed:", {
          message: result.error?.message,
          code: result.error?.code,
          details: result.error?.details,
        })

        setError({
          message: result.error?.message || "Failed to complete onboarding",
          code: result.error?.code,
        })
        setSubmitting(false)
        return
      }

      haptics.celebration()

      if (user) {
        console.log("[onboarding:redirect] Onboarding successful, redirecting to /parent/dashboard")
        router.push("/parent/dashboard")
      } else {
        console.log("[v0] Preview mode - onboarding complete!")
        setError({ message: "Onboarding complete! (Preview mode - would redirect to dashboard)" })
        setSubmitting(false)
      }
    } catch (err: any) {
      console.error("[v0] Onboarding error:", err)
      setError({
        message: err.message || "Failed to complete onboarding. Please try again.",
        code: "UNEXPECTED_ERROR",
      })
      setSubmitting(false)
    }
  }

  if (authError) {
    return <AuthErrorPanel message={authError} diagnosticHint={authDiagnostic || undefined} onRetry={handleRetryAuth} />
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh max-h-svh w-full items-center justify-center overflow-y-auto p-4 md:p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="h-7 w-7 text-indigo-600" />
              <h1 className="text-3xl font-bold text-indigo-600">Welcome to StarSprout</h1>
            </div>
            <p className="text-xs text-muted-foreground">Let's set up your family in just a few steps</p>
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
                  <CardHeader className="pb-4">
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
                      {error && (
                        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-900">{error.message}</p>
                            {error.code && <p className="text-xs text-red-700 mt-0.5">Error code: {error.code}</p>}
                          </div>
                        </div>
                      )}
                      <Button onClick={handleNext} className="w-full">
                        Next
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === 2 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Add Your First Child</CardTitle>
                    <CardDescription>We'll create their StarSprout profile</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
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

                      {error && (
                        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-900">{error.message}</p>
                            {error.code && <p className="text-xs text-red-700 mt-0.5">Error code: {error.code}</p>}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleBack} className="flex-1 bg-transparent">
                          Back
                        </Button>
                        <Button onClick={handleNext} className="flex-1">
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === 3 && (
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle>Privacy & Consent</CardTitle>
                    <CardDescription>Your trust is our top priority</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-5">
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
                          <p className="text-xs text-muted-foreground">
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
                          <p className="text-xs text-muted-foreground">
                            AI-powered motivations and insights. All data is anonymized and never shared. You can enable
                            this later in Settings.
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
                          <p className="text-xs text-muted-foreground">
                            Friends-only leaderboards. Parent approval required for all connections. You can enable this
                            later in Settings.
                          </p>
                        </div>
                      </div>

                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs text-blue-900">
                          Don't worry! You can always enable or disable AI and Social features later in your Settings
                          page. You'll be asked to provide consent when enabling them.
                        </p>
                      </div>

                      {error && (
                        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-900">{error.message}</p>
                            {error.code && <p className="text-xs text-red-700 mt-0.5">Error code: {error.code}</p>}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleBack} className="flex-1 bg-transparent">
                          Back
                        </Button>
                        <Button onClick={handleNext} className="flex-1">
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === 4 && (
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle>Assign First Quest</CardTitle>
                    <CardDescription>Pick a starter quest for {childNickname}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-5">
                      <div className="grid grid-cols-1 gap-2">
                        {STARTER_QUESTS.map((quest, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setSelectedQuest(index)}
                            className={cn(
                              "flex items-center gap-4 rounded-lg border-2 p-3 text-left transition-all hover:bg-gray-50",
                              selectedQuest === index ? "border-indigo-600 bg-indigo-50" : "border-gray-200",
                            )}
                          >
                            <span className="text-2xl">{quest.emoji}</span>
                            <div className="flex-1">
                              <p className="font-medium">{quest.title}</p>
                              <p className="text-sm text-muted-foreground">{quest.points} points</p>
                            </div>
                          </button>
                        ))}
                      </div>

                      {error && (
                        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-900">{error.message}</p>
                            {error.code && <p className="text-xs text-red-700 mt-0.5">Error code: {error.code}</p>}
                            <Button
                              variant="link"
                              size="sm"
                              onClick={handleComplete}
                              className="h-auto p-0 text-xs text-red-700 underline mt-1"
                              disabled={submitting}
                            >
                              Retry
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={handleBack}
                          className="flex-1 bg-transparent"
                          disabled={submitting}
                        >
                          Back
                        </Button>
                        <Button onClick={handleComplete} className="flex-1" disabled={submitting}>
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
