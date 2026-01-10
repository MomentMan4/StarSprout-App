"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, RefreshCw } from "lucide-react"
import { useClerk } from "@clerk/nextjs"

interface AuthErrorPanelProps {
  message: string
  diagnosticHint?: string
  onRetry?: () => void
}

export function AuthErrorPanel({ message, diagnosticHint, onRetry }: AuthErrorPanelProps) {
  const { signOut } = useClerk()

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-4">
      <Card className="w-full max-w-md border-red-200">
        <CardHeader>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <CardTitle>Session Error</CardTitle>
          </div>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {diagnosticHint && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
              <p className="text-xs text-yellow-900">{diagnosticHint}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {onRetry && (
              <Button onClick={onRetry} variant="default" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
            <Button onClick={() => signOut({ redirectUrl: "/" })} variant="outline" className="w-full">
              Sign Out
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">If this problem persists, please contact support</p>
        </CardContent>
      </Card>
    </div>
  )
}
