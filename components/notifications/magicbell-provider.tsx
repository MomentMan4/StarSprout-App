"use client"

import type React from "react"
import { useUser } from "@clerk/nextjs"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

// MagicBell React SDK placeholder
// In production, install: npm install @magicbell/magicbell-react
// import MagicBell from "@magicbell/magicbell-react"

export function MagicBellProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const pathname = usePathname()
  const [apiKey, setApiKey] = useState<string>("")

  const isPublicRoute =
    pathname === "/" ||
    pathname?.startsWith("/sign-in") ||
    pathname?.startsWith("/sign-up") ||
    pathname?.startsWith("/legal")

  useEffect(() => {
    if (user && !isPublicRoute) {
      fetch("/api/magicbell/config")
        .then((res) => res.json())
        .then((data) => setApiKey(data.apiKey))
        .catch(() => setApiKey(""))
    }
  }, [user, isPublicRoute])

  // Don't wrap with MagicBell on public routes or when not signed in
  if (!user || isPublicRoute) {
    return <>{children}</>
  }

  // For MVP, render without MagicBell
  // In production, wrap with MagicBell provider:
  /*
  if (!apiKey) {
    return <>{children}</>
  }

  return (
    <MagicBell
      apiKey={apiKey}
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
