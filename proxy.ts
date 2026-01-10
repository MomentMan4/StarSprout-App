import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const hasClerkConfig = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
const isProductionKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_live_")

function isV0PreviewRequest(req: NextRequest): boolean {
  const hostname = req.headers.get("host") || ""
  return hostname.includes("v0.app") || hostname.includes("vercel.app")
}

const isParentRoute = hasClerkConfig ? createRouteMatcher(["/parent(.*)"]) : () => false
const isChildRoute = hasClerkConfig ? createRouteMatcher(["/kid(.*)"]) : () => false
const isOnboardingRoute = hasClerkConfig ? createRouteMatcher(["/onboarding(.*)"]) : () => false
const isAdminRoute = hasClerkConfig ? createRouteMatcher(["/admin(.*)"]) : () => false

export default clerkMiddleware(
  async (auth, req) => {
    console.log("[v0] Middleware executing for:", req.nextUrl.pathname)

    const isPreview = isV0PreviewRequest(req)
    if (isPreview && isProductionKey) {
      console.log("[v0] Production Clerk keys detected in v0 preview - bypassing all auth")
      return NextResponse.next()
    }

    if (!hasClerkConfig) {
      console.log("[v0] Clerk not configured - allowing all routes in preview mode")
      return NextResponse.next()
    }

    const { userId, sessionClaims } = await auth()
    console.log("[v0] User ID:", userId || "Not authenticated")

    // Allow public routes
    if (
      req.nextUrl.pathname === "/" ||
      req.nextUrl.pathname.startsWith("/legal") ||
      req.nextUrl.pathname.startsWith("/sign-in") ||
      req.nextUrl.pathname.startsWith("/sign-up") ||
      req.nextUrl.pathname === "/admin/unauthorized"
    ) {
      console.log("[v0] Public route allowed:", req.nextUrl.pathname)
      return NextResponse.next()
    }

    // Require authentication for protected routes
    if (!userId) {
      const signInUrl = new URL("/sign-in", req.url)
      signInUrl.searchParams.set("redirect_url", req.url)
      return NextResponse.redirect(signInUrl)
    }

    if (isAdminRoute(req)) {
      // Admin check happens in the layout, just ensure authenticated
      return NextResponse.next()
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
  },
  {
    debug: true,
    ignoredRoutes:
      !hasClerkConfig ||
      (isProductionKey &&
        typeof window !== "undefined" &&
        (window.location?.hostname?.includes("v0.app") || window.location?.hostname?.includes("vercel.app")))
        ? ["/(.*)"]
        : [],
  },
)

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
