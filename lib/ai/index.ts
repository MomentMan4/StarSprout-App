// OpenAI integration wrapper for StarSprout AI features

import { generateText } from "ai"

export interface AIMotivationOptions {
  childNickname: string
  ageBand: string
  questTitle: string
  questCategory: string
}

export interface AIReflectionOptions {
  childNickname: string
  ageBand: string
  questTitle: string
}

export interface AITemplateGenerationOptions {
  scenario: string
  ageBand: string
  count?: number
}

export interface AIWeeklyBriefOptions {
  householdName: string
  childrenNames: string[]
  questsCompleted: number
  categoriesData: Record<string, number>
  streakData: Record<string, number>
}

// Fallback messages when AI is unavailable
const FALLBACK_MOTIVATIONS = [
  "Great job! Keep up the awesome work!",
  "You're doing amazing! Every quest makes you stronger!",
  "Way to go! You're building great habits!",
  "Fantastic effort! You should be proud!",
  "Keep it up! You're on a roll!",
]

const FALLBACK_REFLECTIONS = [
  "How did that make you feel?",
  "What was your favorite part?",
  "What did you learn from this?",
  "Would you do it differently next time?",
  "What made this easy or hard?",
]

function getRandomFallback(fallbacks: string[]): string {
  return fallbacks[Math.floor(Math.random() * fallbacks.length)]
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string, limit = 10, windowMs = 60000): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (userLimit.count >= limit) {
    return false
  }

  userLimit.count++
  return true
}

export async function generateMotivation(options: AIMotivationOptions): Promise<string> {
  try {
    // Check if OpenAI is available
    if (!process.env.OPENAI_API_KEY) {
      return getRandomFallback(FALLBACK_MOTIVATIONS)
    }

    const ageBandText = options.ageBand.replace("_", "-")
    const prompt = `Generate a short, enthusiastic, positive motivational message (max 15 words) for a ${ageBandText} year old child named ${options.childNickname} who just completed a quest titled "${options.questTitle}" in the ${options.questCategory} category. Be age-appropriate, encouraging, and avoid any negative language or shame.`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      maxTokens: 50,
    })

    return text.trim() || getRandomFallback(FALLBACK_MOTIVATIONS)
  } catch (error) {
    console.error("[v0] AI motivation error:", error)
    return getRandomFallback(FALLBACK_MOTIVATIONS)
  }
}

export async function generateReflectionPrompt(options: AIReflectionOptions): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return getRandomFallback(FALLBACK_REFLECTIONS)
    }

    const ageBandText = options.ageBand.replace("_", "-")
    const prompt = `Generate a single, simple, age-appropriate reflection question (max 12 words) for a ${ageBandText} year old named ${options.childNickname} who just completed: "${options.questTitle}". Make it curious and positive, not evaluative or judgmental.`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      maxTokens: 40,
    })

    return text.trim() || getRandomFallback(FALLBACK_REFLECTIONS)
  } catch (error) {
    console.error("[v0] AI reflection error:", error)
    return getRandomFallback(FALLBACK_REFLECTIONS)
  }
}

export async function generateQuestTemplates(
  options: AITemplateGenerationOptions,
): Promise<Array<{ title: string; description: string; category: string; points: number }>> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return [
        {
          title: "Help with " + options.scenario,
          description: "Complete this helpful task",
          category: "other",
          points: 10,
        },
      ]
    }

    const count = options.count || 3
    const ageBandText = options.ageBand.replace("_", "-")
    const prompt = `Generate ${count} quest templates for ${ageBandText} year old children based on: "${options.scenario}". Return as JSON array with format: [{"title": "...", "description": "...", "category": "chores|homework|hygiene|exercise|creativity|kindness|other", "points": 5-20}]. Keep titles under 40 chars, descriptions under 100 chars. Be positive and age-appropriate.`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      maxTokens: 500,
    })

    const parsed = JSON.parse(text.trim())
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error("[v0] AI template generation error:", error)
    return []
  }
}

export async function generateWeeklyBrief(options: AIWeeklyBriefOptions): Promise<{
  summary: string
  strengths: string[]
  opportunities: string[]
  suggestedPraise: string
}> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      // Return fallback
      return {
        summary: `This week, ${options.householdName || "your household"} completed ${options.questsCompleted} quests! Everyone is building great habits and making progress.`,
        strengths: [
          "Consistent daily engagement",
          "Variety of quest categories completed",
          "Strong teamwork and effort",
        ],
        opportunities: ["Try new quest categories", "Build longer streaks", "Set stretch goals together"],
        suggestedPraise: `"I'm so proud of how you've been tackling your quests this week. You're building great habits!"`,
      }
    }

    const childrenList = options.childrenNames.join(", ")
    const categoriesText = Object.entries(options.categoriesData)
      .map(([cat, count]) => `${cat}: ${count}`)
      .join(", ")
    const streaksText = Object.entries(options.streakData)
      .map(([name, days]) => `${name}: ${days} days`)
      .join(", ")

    const prompt = `Generate a supportive, insight-focused (not surveillance-focused) weekly summary for parents in household "${options.householdName}" with children: ${childrenList}.

This week's data:
- Total quests completed: ${options.questsCompleted}
- Categories: ${categoriesText}
- Streaks: ${streaksText}

Return as JSON with format:
{
  "summary": "2-3 sentence narrative paragraph highlighting progress and patterns",
  "strengths": ["3 specific strengths observed"],
  "opportunities": ["3 gentle, positive suggestions"],
  "suggestedPraise": "One specific praise line parents can use with their kids"
}

Keep tone calm, supportive, and focused on habits and growth, not perfection. Avoid surveillance language.`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      maxTokens: 600,
    })

    const parsed = JSON.parse(text.trim())
    return {
      summary: parsed.summary || "Great progress this week!",
      strengths: Array.isArray(parsed.strengths)
        ? parsed.strengths
        : ["Good effort", "Steady progress", "Building habits"],
      opportunities: Array.isArray(parsed.opportunities)
        ? parsed.opportunities
        : ["Keep going", "Try new challenges", "Stay consistent"],
      suggestedPraise: parsed.suggestedPraise || "Great work this week!",
    }
  } catch (error) {
    console.error("[v0] AI weekly brief error:", error)
    return {
      summary: `This week was productive with ${options.questsCompleted} quests completed!`,
      strengths: ["Good progress", "Steady effort", "Positive momentum"],
      opportunities: ["Keep going", "Stay consistent", "Try new challenges"],
      suggestedPraise: "Great work this week!",
    }
  }
}

export async function generateDifficultyTuning(options: {
  childNickname: string
  ageBand: string
  recentCompletionRate: number
  categoryPerformance: Record<string, number>
}): Promise<{
  recommendation: string
  suggestedAdjustments: string[]
}> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        recommendation: "Current quest difficulty seems appropriate. Keep building consistency!",
        suggestedAdjustments: ["Continue with current quest types", "Add variety when ready", "Celebrate progress"],
      }
    }

    const categoryText = Object.entries(options.categoryPerformance)
      .map(([cat, rate]) => `${cat}: ${rate}%`)
      .join(", ")

    const prompt = `Analyze quest difficulty for ${options.childNickname} (age ${options.ageBand.replace("_", "-")}):
- Overall completion rate: ${options.recentCompletionRate}%
- Category performance: ${categoryText}

Return JSON: {"recommendation": "1 sentence summary", "suggestedAdjustments": ["3 specific, gentle suggestions"]}
Be supportive and focus on growth, not judgment.`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      maxTokens: 300,
    })

    const parsed = JSON.parse(text.trim())
    return {
      recommendation: parsed.recommendation || "Keep up the great work!",
      suggestedAdjustments: Array.isArray(parsed.suggestedAdjustments)
        ? parsed.suggestedAdjustments
        : ["Continue current approach", "Add variety gradually", "Celebrate successes"],
    }
  } catch (error) {
    console.error("[v0] AI tuning error:", error)
    return {
      recommendation: "Current quest difficulty seems appropriate.",
      suggestedAdjustments: ["Continue with current quest types", "Add variety when ready", "Celebrate progress"],
    }
  }
}

export { checkRateLimit }
