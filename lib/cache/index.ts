// Upstash Redis caching wrapper

import { Redis } from "@upstash/redis"

let redis: Redis | null = null

function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    })
  }
  return redis
}

export async function cacheSet(key: string, value: any, ttlSeconds = 3600): Promise<boolean> {
  try {
    const client = getRedisClient()
    await client.setex(key, ttlSeconds, JSON.stringify(value))
    return true
  } catch (error) {
    console.error("[v0] Cache set error:", error)
    return false
  }
}

export async function cacheGet<T = any>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient()
    const data = await client.get(key)
    return data ? (JSON.parse(data as string) as T) : null
  } catch (error) {
    console.error("[v0] Cache get error:", error)
    return null
  }
}

export async function cacheDelete(key: string): Promise<boolean> {
  try {
    const client = getRedisClient()
    await client.del(key)
    return true
  } catch (error) {
    console.error("[v0] Cache delete error:", error)
    return false
  }
}

export async function cacheLeaderboard(userId: string, data: any, weekKey: string): Promise<boolean> {
  return cacheSet(`leaderboard:${userId}:${weekKey}`, data, 86400) // 24 hour TTL
}

export async function getLeaderboardCache(userId: string, weekKey: string): Promise<any> {
  return cacheGet(`leaderboard:${userId}:${weekKey}`)
}
