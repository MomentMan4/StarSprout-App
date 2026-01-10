export interface AuthHealthCheck {
  isHealthy: boolean
  issues: string[]
  environment: "production" | "preview" | "development"
  keyType: "live" | "test" | "missing"
}

export function checkAuthHealth(): AuthHealthCheck {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const secretKey = process.env.CLERK_SECRET_KEY
  const nodeEnv = process.env.NODE_ENV
  const vercelEnv = process.env.VERCEL_ENV

  const issues: string[] = []

  // Determine environment
  const environment: "production" | "preview" | "development" =
    vercelEnv === "production" ? "production" : vercelEnv === "preview" ? "preview" : "development"

  // Check if keys are present
  if (!publishableKey) {
    issues.push("Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY")
  }
  if (!secretKey) {
    issues.push("Missing CLERK_SECRET_KEY")
  }

  // Determine key type
  let keyType: "live" | "test" | "missing" = "missing"
  if (publishableKey) {
    if (publishableKey.startsWith("pk_live_")) {
      keyType = "live"
    } else if (publishableKey.startsWith("pk_test_")) {
      keyType = "test"
    }
  }

  // Check for production misconfigurations
  if (environment === "production" && keyType === "test") {
    issues.push("Production environment using test/development Clerk keys")
  }

  // Check for dev instance on production domain
  if (environment === "production" && publishableKey?.includes("dev-")) {
    issues.push("Production domain using development Clerk instance")
  }

  const isHealthy = issues.length === 0

  if (!isHealthy) {
    console.error("[auth:health] Auth health check failed:", {
      environment,
      keyType,
      issues,
    })
  } else {
    console.log("[auth:health] Auth health check passed:", {
      environment,
      keyType,
    })
  }

  return {
    isHealthy,
    issues,
    environment,
    keyType,
  }
}

export function getAuthHealthMessage(health: AuthHealthCheck): string {
  if (health.isHealthy) {
    return "Authentication is configured correctly"
  }

  if (health.issues.includes("Production environment using test/development Clerk keys")) {
    return "Auth configuration issue: Production deployment is using test/development keys. Please update to production Clerk keys."
  }

  if (health.issues.includes("Production domain using development Clerk instance")) {
    return "Auth configuration issue: Development Clerk instance detected on production domain. Please use a production Clerk instance."
  }

  return "Auth configuration issue detected. Please check your Clerk settings."
}
