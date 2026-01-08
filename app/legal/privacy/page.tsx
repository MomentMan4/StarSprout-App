export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-6">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

      <div className="prose prose-slate max-w-none">
        <p className="text-muted-foreground">Last updated: January 2026</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Overview</h2>
        <p>
          StarSprout is designed with privacy and trust as top priorities. We collect minimal data and implement
          household-level isolation to protect your family's information.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Data We Collect</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Parent email and password (for authentication)</li>
          <li>Child nickname and age range (no full names or birthdates)</li>
          <li>Quest completion data and points</li>
          <li>Badges and rewards</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Data We DON'T Collect</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Child's full name or birthdate</li>
          <li>Location or school information</li>
          <li>Third-party tracking cookies</li>
          <li>Advertising identifiers</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">COPPA Compliance</h2>
        <p>
          StarSprout is designed to be COPPA-compliant. We require verifiable parent consent before allowing children to
          use the platform.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">AI Features</h2>
        <p>
          If enabled, AI features use anonymized data (nickname and age range only) to generate motivational messages
          and insights. No personally identifiable information is sent to AI providers.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Your Rights</h2>
        <p>Parents can access, export, or delete all household data at any time from the Settings page.</p>
      </div>
    </div>
  )
}
