/**
 * Environment variable validation
 * Ensures required server-side env vars are present before proceeding
 */

export function getEnv(key: string, required = true): string {
  const value = process.env[key]

  if (required && !value) {
    throw new Error(
      `Missing required environment variable: ${key}. Please configure it in your Vercel project settings.`,
    )
  }

  return value || ""
}

export function validateSupabaseEnv(): void {
  getEnv("SUPABASE_URL", true)
  getEnv("SUPABASE_SERVICE_ROLE_KEY", true)
}

// Client-side env vars (optional validation)
export function validatePublicEnv(): void {
  if (typeof window !== "undefined") {
    // Only validate in browser
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.warn("[StarSprout] Missing NEXT_PUBLIC_SUPABASE_URL - client features may not work")
    }
  }
}
