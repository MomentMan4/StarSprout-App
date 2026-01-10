"use client"

import { useEffect, useState } from "react"

export function PreviewNotice() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const isV0Preview = window.location.hostname.includes("v0.app") || window.location.hostname.includes("vercel.app")
    const hasProductionKeys =
      document.querySelector('meta[name="clerk-environment"]')?.getAttribute("content") === "production"

    if (isV0Preview && hasProductionKeys) {
      setShow(true)
      console.log("[v0] Preview mode active - authentication disabled due to production key domain restrictions")
    }
  }, [])

  if (!show) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 text-sm text-center font-medium">
      Preview Mode: Authentication is disabled because production Clerk keys only work on starsprout.io
    </div>
  )
}
