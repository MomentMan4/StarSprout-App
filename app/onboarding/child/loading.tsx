export default function ChildOnboardingLoading() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="w-full max-w-lg">
        <div className="flex flex-col gap-6 items-center">
          <div className="text-center mb-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Join StarSprout!
            </h1>
            <p className="text-sm text-muted-foreground mt-2">Loading your adventure...</p>
          </div>

          <div className="w-full max-w-sm">
            <div className="flex flex-col gap-4 animate-pulse">
              <div className="h-12 bg-gray-200 rounded-md" />
              <div className="h-12 bg-gray-200 rounded-md" />
              <div className="h-12 bg-gray-200 rounded-md" />
              <div className="h-10 bg-gray-200 rounded-md mt-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
