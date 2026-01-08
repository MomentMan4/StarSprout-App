import { NextResponse } from "next/server"

export async function GET() {
  // Return the MagicBell public API key
  // This is safe to expose as it's the public key meant for client-side use
  const apiKey = process.env.NEXT_PUBLIC_MAGICBELL_API_KEY || ""

  return NextResponse.json({
    apiKey,
  })
}
