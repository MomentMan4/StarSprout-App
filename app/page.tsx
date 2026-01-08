import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="text-center space-y-8 max-w-3xl">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-indigo-600">StarSprout</h1>
          <p className="text-2xl text-balance font-medium text-gray-700">Build habits through quests</p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            A trust-first, playful quest system that helps children build consistent habits while giving parents
            actionable insights. Privacy-by-design with parent consent and household-level access control.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Link href="/sign-up">
            <Button size="lg" className="text-lg px-8">
              Get Started
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
              Login
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <h3 className="font-semibold text-lg mb-2">For Kids</h3>
            <p className="text-sm text-muted-foreground">
              Complete quests, earn points, unlock badges, and build great habits through gameplay
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <h3 className="font-semibold text-lg mb-2">For Parents</h3>
            <p className="text-sm text-muted-foreground">
              Assign tasks quickly, track progress, get weekly insights, and celebrate achievements
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <h3 className="font-semibold text-lg mb-2">Privacy First</h3>
            <p className="text-sm text-muted-foreground">
              COPPA/GDPR aligned, no tracking, household isolation, and parent-controlled features
            </p>
          </div>
        </div>
      </div>

      <footer className="mt-16 text-center text-sm text-muted-foreground">
        <div className="flex gap-4 justify-center">
          <Link href="/legal/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          <Link href="/legal/terms" className="hover:underline">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  )
}
