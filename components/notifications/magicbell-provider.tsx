"use client"

import type React from "react"
import { useUser } from "@clerk/nextjs"

// MagicBell React SDK placeholder
// In production, install: npm install @magicbell/magicbell-react
// import MagicBell from "@magicbell/magicbell-react"

export function MagicBellProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()

  // For MVP, render without MagicBell
  // In production, wrap with MagicBell provider:
  /*
  if (!user) return <>{children}</>

  return (
    <MagicBell
      apiKey={process.env.NEXT_PUBLIC_MAGICBELL_API_KEY!}
      userExternalId={user.id}
      defaultIsOpen={false}
      locale="en"
      theme={{
        icon: { borderColor: "#6366f1" },
        unseenBadge: { backgroundColor: "#ef4444" },
      }}
    >
      {children}
    </MagicBell>
  )
  */

  return <>{children}</>
}
