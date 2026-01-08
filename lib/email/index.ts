// Email service wrapper for Resend (parent-only emails)

import { Resend } from "resend"
import { WelcomeEmail } from "@/emails/welcome"
import { WeeklySummaryEmail } from "@/emails/weekly-summary"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface SendWelcomeEmailParams {
  to: string
  parentName: string
  householdName: string
}

interface SendWeeklySummaryParams {
  to: string
  parentName: string
  weekStart: string
  weekEnd: string
  questsCompleted: number
  badgesEarned: number
  childHighlights: Array<{ name: string; quests: number; streak: number }>
  strengths: string[]
  opportunities: string[]
  dashboardLink: string
}

export async function sendWelcomeEmail({ to, parentName, householdName }: SendWelcomeEmailParams): Promise<boolean> {
  if (!resend) {
    console.log("[v0] Resend not configured, skipping welcome email")
    return false
  }

  try {
    await resend.emails.send({
      from: "StarSprout <hello@starsprout.app>", // Configure your verified domain
      to,
      subject: "Welcome to StarSprout!",
      react: WelcomeEmail({ parentName, householdName }),
    })
    return true
  } catch (error) {
    console.error("[v0] Failed to send welcome email:", error)
    return false
  }
}

export async function sendWeeklySummaryEmail(params: SendWeeklySummaryParams): Promise<boolean> {
  if (!resend) {
    console.log("[v0] Resend not configured, skipping weekly summary email")
    return false
  }

  try {
    await resend.emails.send({
      from: "StarSprout <weekly@starsprout.app>", // Configure your verified domain
      to: params.to,
      subject: `Your StarSprout Weekly Summary - ${params.weekStart}`,
      react: WeeklySummaryEmail(params),
    })
    return true
  } catch (error) {
    console.error("[v0] Failed to send weekly summary email:", error)
    return false
  }
}
