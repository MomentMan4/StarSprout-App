import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[Supabase] Missing environment variables for Supabase connection")
    // Return a mock client that will fail gracefully
    return createSupabaseClient(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey || "placeholder")
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}
