import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[v0] Supabase environment variables not set. Using placeholder values.")
    return createBrowserClient("https://placeholder.supabase.co", "placeholder-anon-key")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
