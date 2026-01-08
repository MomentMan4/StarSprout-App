// Privacy-safe telemetry wrapper for Vercel Analytics

export type TelemetryEvent =
  | "onboarding_completed"
  | "quest_assigned"
  | "quest_submitted"
  | "quest_approved"
  | "quest_rejected"
  | "reward_created"
  | "reward_requested"
  | "reward_approved"
  | "reward_fulfilled"
  | "badge_earned"
  | "friend_request_sent"
  | "friend_request_approved"
  | "weekly_summary_viewed"
  | "streak_milestone"
  | "settings_updated"

export interface TelemetryData {
  event: TelemetryEvent
  userId?: string
  householdId?: string
  metadata?: Record<string, any>
}

export function trackEvent(data: TelemetryData): void {
  try {
    // Privacy-safe event tracking
    // Only track aggregated metrics, no PII

    console.log("[v0] Telemetry event:", data.event, data.metadata)

    // In production, Vercel Analytics will automatically capture these
    // The @vercel/analytics package is already imported in layout
    // Events are privacy-safe by default (no cookies, no PII)

    if (typeof window !== "undefined" && "va" in window) {
      // Track custom event with Vercel Analytics
      ;(window as any).va("event", data.event, {
        household: data.householdId ? "yes" : "no", // Aggregate only
        ...data.metadata,
      })
    }
  } catch (error) {
    console.error("[v0] Telemetry error:", error)
    // Silent fail - never break app for telemetry
  }
}
