/**
 * Supabase Admin Client
 * Uses SERVICE_ROLE_KEY for server-side operations that bypass RLS
 * NEVER expose this client to the browser
 */

import { createClient } from "@supabase/supabase-js"
import { getEnv, validateSupabaseEnv } from "@/lib/env"

let adminClientInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (adminClientInstance) {
    return adminClientInstance
  }

  // Validate env vars exist
  validateSupabaseEnv()

  const supabaseUrl = getEnv("SUPABASE_URL")
  const supabaseServiceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY")

  console.log("[onboarding:supabaseAdmin] Creating admin client")
  console.log("[onboarding:supabaseAdmin] URL configured:", !!supabaseUrl)
  console.log("[onboarding:supabaseAdmin] Service key configured:", !!supabaseServiceKey)

  adminClientInstance = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return adminClientInstance
}
