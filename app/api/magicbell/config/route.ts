import { NextResponse } from "next/server"

export async function GET() {
  // Return the MagicBell public API key from server-side env var
  // This prevents exposing the key directly in client-side code
  const apiKey = process.env.MAGICBELL_API_KEY || ""

  return NextResponse.json({
    apiKey,
  })
}
