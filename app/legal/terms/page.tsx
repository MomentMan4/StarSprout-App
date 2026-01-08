export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-6">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

      <div className="prose prose-slate max-w-none">
        <p className="text-muted-foreground">Last updated: January 2026</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Acceptance of Terms</h2>
        <p>
          By using StarSprout, you agree to these terms and confirm that you are a parent or legal guardian with
          authority to create accounts for your children.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Parent Responsibilities</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Supervise your children's use of StarSprout</li>
          <li>Review and approve friend connections</li>
          <li>Ensure quest assignments are age-appropriate</li>
          <li>Fulfill reward redemptions in a timely manner</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Prohibited Uses</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Creating accounts for children without parental authority</li>
          <li>Sharing accounts or login credentials</li>
          <li>Attempting to access other households' data</li>
          <li>Using the platform for commercial purposes</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Account Termination</h2>
        <p>
          Parents may delete their household account at any time. All data will be permanently removed within 30 days.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Disclaimer</h2>
        <p>
          StarSprout is a tool to support family habit-building. We are not responsible for family dynamics, rewards
          fulfillment, or child behavior outcomes.
        </p>
      </div>
    </div>
  )
}
