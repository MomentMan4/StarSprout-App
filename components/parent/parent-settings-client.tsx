"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import type { Household, User, NotificationPreference, FeatureFlag } from "@/lib/db/types"
import { haptic } from "@/lib/haptics"

interface ParentSettingsClientProps {
  household: Household | null
  children: User[]
  notificationPrefs: NotificationPreference | null
  featureFlags: FeatureFlag[]
  userId: string
  householdId: string
}

export function ParentSettingsClient({
  household,
  children,
  notificationPrefs,
  featureFlags,
  userId,
  householdId,
}: ParentSettingsClientProps) {
  const router = useRouter()

  // AI toggles
  const [aiMotivation, setAiMotivation] = useState(
    featureFlags.some((f) => f.flag_key === "ai_motivation" && f.is_enabled),
  )
  const [aiReflection, setAiReflection] = useState(
    featureFlags.some((f) => f.flag_key === "ai_reflection" && f.is_enabled),
  )
  const [aiWeeklySummary, setAiWeeklySummary] = useState(
    featureFlags.some((f) => f.flag_key === "ai_weekly_summary" && f.is_enabled),
  )

  // Notification preferences
  const [inAppEnabled, setInAppEnabled] = useState(notificationPrefs?.in_app_enabled ?? true)
  const [emailEnabled, setEmailEnabled] = useState(notificationPrefs?.email_enabled ?? false)
  const [weeklySummaryEmail, setWeeklySummaryEmail] = useState(notificationPrefs?.weekly_summary_email ?? false)

  const [showAIConsentDialog, setShowAIConsentDialog] = useState(false)
  const [showSocialConsentDialog, setShowSocialConsentDialog] = useState(false)
  const [pendingAIToggle, setPendingAIToggle] = useState(false)
  const [pendingSocialToggle, setPendingSocialToggle] = useState(false)
  const [aiConsentChecked, setAiConsentChecked] = useState(false)
  const [socialConsentChecked, setSocialConsentChecked] = useState(false)

  const [socialEnabled, setSocialEnabled] = useState(
    featureFlags.some((f) => f.flag_key === "social_features" && f.is_enabled),
  )

  const [saving, setSaving] = useState(false)

  const handleToggleWithHaptic = (setter: (value: boolean) => void) => (value: boolean) => {
    haptic("TAP")
    setter(value)
  }

  const handleAIFeatureToggle = (featureName: string, currentValue: boolean, newValue: boolean) => {
    // If turning ON and currently ALL AI features are OFF, require consent
    const anyAIEnabled = aiMotivation || aiReflection || aiWeeklySummary

    if (newValue && !anyAIEnabled) {
      setPendingAIToggle(true)
      setShowAIConsentDialog(true)
      setAiConsentChecked(false)
      return
    }

    // Otherwise, just toggle normally
    haptic("TAP")
    if (featureName === "motivation") setAiMotivation(newValue)
    if (featureName === "reflection") setAiReflection(newValue)
    if (featureName === "weekly") setAiWeeklySummary(newValue)
  }

  const handleSocialToggle = (newValue: boolean) => {
    // If turning ON, require consent
    if (newValue && !socialEnabled) {
      setPendingSocialToggle(true)
      setShowSocialConsentDialog(true)
      setSocialConsentChecked(false)
      return
    }

    // If turning OFF, just toggle
    haptic("TAP")
    setSocialEnabled(newValue)
  }

  const handleAIConsentConfirm = () => {
    if (!aiConsentChecked) return

    haptic("SUCCESS")
    setShowAIConsentDialog(false)

    // Enable the AI feature that was pending
    // For simplicity, enable all AI features when consent is given
    setAiMotivation(true)
    setAiReflection(true)
    setAiWeeklySummary(true)
  }

  const handleSocialConsentConfirm = () => {
    if (!socialConsentChecked) return

    haptic("SUCCESS")
    setShowSocialConsentDialog(false)
    setSocialEnabled(true)
  }

  const handleSaveAISettings = async () => {
    setSaving(true)
    try {
      await fetch("/api/settings/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId,
          userId,
          flags: {
            ai_motivation: aiMotivation,
            ai_reflection: aiReflection,
            ai_weekly_summary: aiWeeklySummary,
          },
        }),
      })
      haptic("SUCCESS")
      router.refresh()
    } catch (error) {
      console.error("[v0] Error saving AI settings:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSocialSettings = async () => {
    setSaving(true)
    try {
      await fetch("/api/settings/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId,
          userId,
          flags: {
            social_features: socialEnabled,
          },
        }),
      })
      haptic("SUCCESS")
      router.refresh()
    } catch (error) {
      console.error("[v0] Error saving social settings:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    try {
      await fetch("/api/settings/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          in_app_enabled: inAppEnabled,
          email_enabled: emailEnabled,
          weekly_summary_email: weeklySummaryEmail,
        }),
      })
      haptic("SUCCESS")
      router.refresh()
    } catch (error) {
      console.error("[v0] Error saving notification settings:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Household Info */}
      <Card>
        <CardHeader>
          <CardTitle>Household Information</CardTitle>
          <CardDescription>Your family details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Household Name</p>
              <p className="font-medium">{household?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {household?.created_at ? new Date(household.created_at).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Children */}
      <Card>
        <CardHeader>
          <CardTitle>Children</CardTitle>
          <CardDescription>Manage children in your household</CardDescription>
        </CardHeader>
        <CardContent>
          {children && children.length > 0 ? (
            <div className="space-y-3">
              {children.map((child) => (
                <div key={child.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{child.nickname}</p>
                    <p className="text-sm text-muted-foreground">
                      {child.age_band ? child.age_band.replace("_", " ") : "Age not set"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No children added</p>
          )}
        </CardContent>
      </Card>

      {/* AI Features */}
      <Card>
        <CardHeader>
          <CardTitle>AI Features</CardTitle>
          <CardDescription>Control how AI assists in your child's experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ai-motivation">Motivational Messages</Label>
              <p className="text-sm text-muted-foreground">AI-generated encouragement after quest completions</p>
            </div>
            <Switch
              id="ai-motivation"
              checked={aiMotivation}
              onCheckedChange={(value) => handleAIFeatureToggle("motivation", aiMotivation, value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ai-reflection">Reflection Prompts</Label>
              <p className="text-sm text-muted-foreground">
                AI-generated questions to help kids think about their quests
              </p>
            </div>
            <Switch
              id="ai-reflection"
              checked={aiReflection}
              onCheckedChange={(value) => handleAIFeatureToggle("reflection", aiReflection, value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ai-weekly">Weekly AI Summary</Label>
              <p className="text-sm text-muted-foreground">AI-generated insights and suggestions for parents</p>
            </div>
            <Switch
              id="ai-weekly"
              checked={aiWeeklySummary}
              onCheckedChange={(value) => handleAIFeatureToggle("weekly", aiWeeklySummary, value)}
            />
          </div>

          <Button onClick={handleSaveAISettings} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save AI Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Social Features */}
      <Card>
        <CardHeader>
          <CardTitle>Social Features</CardTitle>
          <CardDescription>Control friend connections and leaderboards</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="social-enabled">Enable Social Features</Label>
              <p className="text-sm text-muted-foreground">
                Friends-only leaderboards with parent-approved connections
              </p>
            </div>
            <Switch id="social-enabled" checked={socialEnabled} onCheckedChange={handleSocialToggle} />
          </div>

          <Button onClick={handleSaveSocialSettings} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Social Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose how you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="in-app">In-App Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications within StarSprout</p>
            </div>
            <Switch id="in-app" checked={inAppEnabled} onCheckedChange={handleToggleWithHaptic(setInAppEnabled)} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive important updates via email</p>
            </div>
            <Switch id="email" checked={emailEnabled} onCheckedChange={handleToggleWithHaptic(setEmailEnabled)} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-email">Weekly Summary Email</Label>
              <p className="text-sm text-muted-foreground">Get a weekly recap of your household's progress</p>
            </div>
            <Switch
              id="weekly-email"
              checked={weeklySummaryEmail}
              onCheckedChange={handleToggleWithHaptic(setWeeklySummaryEmail)}
              disabled={!emailEnabled}
            />
          </div>

          <Button onClick={handleSaveNotifications} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Notification Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Privacy & Data */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy & Data</CardTitle>
          <CardDescription>Understanding what data we collect and how we use it</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-semibold text-sm">What We Store</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Child nicknames (not real names)</li>
              <li>Age band (e.g., 8-10 years)</li>
              <li>Quest completion records</li>
              <li>Points and badges earned</li>
              <li>Friend connections (no messaging)</li>
            </ul>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-semibold text-sm">What We Don't Store</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Precise timestamps (no surveillance)</li>
              <li>Verbatim reflection responses</li>
              <li>Personal identifiable information</li>
              <li>Location data</li>
            </ul>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-semibold text-sm">AI Usage</h4>
            <p className="text-sm text-muted-foreground">
              When AI features are enabled, we send minimal context (nickname, age band, quest category) to generate
              age-appropriate messages. No personal data or reflection content is stored or used for training.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 bg-transparent">
              View Privacy Policy
            </Button>
            <Button variant="outline" className="flex-1 bg-transparent">
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full bg-transparent">
            Sign Out
          </Button>
          <Button variant="destructive" className="w-full">
            Delete Household
          </Button>
        </CardContent>
      </Card>

      {/* AI Consent Dialog */}
      <Dialog open={showAIConsentDialog} onOpenChange={setShowAIConsentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable AI Features?</DialogTitle>
            <DialogDescription>Please review and accept to enable AI-powered features</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <h4 className="font-semibold text-sm">What AI Features Do</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Generate age-appropriate motivational messages</li>
                <li>Create thoughtful reflection prompts</li>
                <li>Provide weekly insights for parents</li>
              </ul>
            </div>
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <h4 className="font-semibold text-sm">Privacy Protection</h4>
              <p className="text-sm text-muted-foreground">
                We only send minimal context (nickname, age band, quest category) to generate messages. No personal data
                is stored or used for training. All data is anonymized and never shared.
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox
                id="ai-consent-dialog"
                checked={aiConsentChecked}
                onCheckedChange={(checked) => setAiConsentChecked(checked === true)}
              />
              <Label htmlFor="ai-consent-dialog" className="text-sm font-medium leading-none cursor-pointer">
                I understand and consent to enabling AI features
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAIConsentDialog(false)
                setPendingAIToggle(false)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAIConsentConfirm} disabled={!aiConsentChecked}>
              Enable AI Features
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Social Consent Dialog */}
      <Dialog open={showSocialConsentDialog} onOpenChange={setShowSocialConsentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Social Features?</DialogTitle>
            <DialogDescription>Please review and accept to enable friend connections</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <h4 className="font-semibold text-sm">What Social Features Include</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Friends-only leaderboards (no public profiles)</li>
                <li>Weekly ranking with approved friends</li>
                <li>Invite codes for connection requests</li>
              </ul>
            </div>
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <h4 className="font-semibold text-sm">Parent Control</h4>
              <p className="text-sm text-muted-foreground">
                All friend requests require parent approval from BOTH families. No messaging or direct communication
                between children. Only points and quest completion counts are visible.
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox
                id="social-consent-dialog"
                checked={socialConsentChecked}
                onCheckedChange={(checked) => setSocialConsentChecked(checked === true)}
              />
              <Label htmlFor="social-consent-dialog" className="text-sm font-medium leading-none cursor-pointer">
                I understand and consent to enabling social features
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSocialConsentDialog(false)
                setPendingSocialToggle(false)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSocialConsentConfirm} disabled={!socialConsentChecked}>
              Enable Social Features
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
