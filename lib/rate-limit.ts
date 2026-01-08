// Rate limiting using Upstash Redis

import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export type RateLimitConfig = {
  uniqueTokenPerInterval: number
  interval: number
}

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig = { uniqueTokenPerInterval: 10, interval: 60000 },
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const key = `rate_limit:${identifier}`
  const now = Date.now()
  const windowStart = now - config.interval

  try {
    // Remove old entries
    await redis.zremrangebyscore(key, 0, windowStart)

    // Count current requests
    const requestCount = await redis.zcard(key)

    if (requestCount >= config.uniqueTokenPerInterval) {
      const oldestRequest = await redis.zrange(key, 0, 0, { withScores: true })
      const resetTime = oldestRequest[0]?.score ? oldestRequest[0].score + config.interval : now + config.interval

      return {
        success: false,
        remaining: 0,
        reset: Math.ceil(resetTime / 1000),
      }
    }

    // Add current request
    await redis.zadd(key, { score: now, member: `${now}:${Math.random()}` })
    await redis.expire(key, Math.ceil(config.interval / 1000))

    return {
      success: true,
      remaining: config.uniqueTokenPerInterval - requestCount - 1,
      reset: Math.ceil((now + config.interval) / 1000),
    }
  } catch (error) {
    console.error("[v0] Rate limit error:", error)
    // Fail open - allow request if Redis is down
    return {
      success: true,
      remaining: config.uniqueTokenPerInterval,
      reset: Math.ceil((now + config.interval) / 1000),
    }
  }
}

// Preset rate limit configurations
export const RATE_LIMITS = {
  AI_MOTIVATION: { uniqueTokenPerInterval: 10, interval: 60000 }, // 10 per minute
  AI_REFLECTION: { uniqueTokenPerInterval: 10, interval: 60000 }, // 10 per minute
  AI_WEEKLY_BRIEF: { uniqueTokenPerInterval: 5, interval: 3600000 }, // 5 per hour
  AI_TUNING: { uniqueTokenPerInterval: 10, interval: 3600000 }, // 10 per hour
  FRIEND_REQUEST: { uniqueTokenPerInterval: 5, interval: 3600000 }, // 5 per hour
  INVITE_CODE: { uniqueTokenPerInterval: 10, interval: 3600000 }, // 10 per hour
}
