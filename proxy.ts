import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isParentRoute = createRouteMatcher(["/parent(.*)"])
const isChildRoute = createRouteMatcher(["/kid(.*)"])
const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()

  // Allow public routes
  if (
    req.nextUrl.pathname === "/" ||
    req.nextUrl.pathname.startsWith("/legal") ||
    req.nextUrl.pathname.startsWith("/sign-in") ||
    req.nextUrl.pathname.startsWith("/sign-up")
  ) {
    return NextResponse.next()
  }

  // Require authentication for protected routes
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("redirect_url", req.url)
    return NextResponse.redirect(signInUrl)
  }

  const metadata = sessionClaims?.public_metadata as
    | {
        role?: "parent" | "child"
        household_id?: string
        age_band?: string
        setup_complete?: boolean
      }
    | undefined

  // Redirect to onboarding if setup is not complete
  if (!metadata?.setup_complete && !isOnboardingRoute(req)) {
    const onboardingUrl = new URL(metadata?.role === "child" ? "/onboarding/child" : "/onboarding/parent", req.url)
    return NextResponse.redirect(onboardingUrl)
  }

  // Role-based route protection
  if (isParentRoute(req) && metadata?.role !== "parent") {
    return NextResponse.redirect(new URL("/kid/home", req.url))
  }

  if (isChildRoute(req) && metadata?.role !== "child") {
    return NextResponse.redirect(new URL("/parent/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
