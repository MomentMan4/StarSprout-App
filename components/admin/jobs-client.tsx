"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { runJobAction } from "@/app/actions/admin-job-actions"
import { BarChart3, Zap, Mail, Bell, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"

type JobType = "recompute_leaderboards" | "recompute_streaks" | "regenerate_weekly_summary" | "replay_notifications"
type JobStatus = "idle" | "running" | "success" | "error"

interface JobState {
  status: JobStatus
  affected?: number
  error?: string
}

export function JobsClient() {
  const [jobs, setJobs] = useState<Record<JobType, JobState>>({
    recompute_leaderboards: { status: "idle" },
    recompute_streaks: { status: "idle" },
    regenerate_weekly_summary: { status: "idle" },
    replay_notifications: { status: "idle" },
  })

  const [selectedHouseholdId, setSelectedHouseholdId] = useState("")
  const [useAI, setUseAI] = useState(false)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [dialogOpen, setDialogOpen] = useState<JobType | null>(null)

  const runJob = async (jobType: JobType, scope: "global" | "household", params: Record<string, any> = {}) => {
    setJobs((prev) => ({ ...prev, [jobType]: { status: "running" } }))

    try {
      const result = await runJobAction(jobType, scope, params)

      setJobs((prev) => ({
        ...prev,
        [jobType]: {
          status: result.success ? "success" : "error",
          affected: result.affected,
          error: result.error,
        },
      }))

      if (result.success) {
        setTimeout(() => {
          setJobs((prev) => ({ ...prev, [jobType]: { status: "idle" } }))
        }, 5000)
      }
    } catch (error) {
      setJobs((prev) => ({
        ...prev,
        [jobType]: {
          status: "error",
          error: String(error),
        },
      }))
    }

    setDialogOpen(null)
  }

  const renderJobStatus = (jobType: JobType) => {
    const state = jobs[jobType]

    if (state.status === "idle") return null

    return (
      <Alert className="mt-4">
        <div className="flex items-center gap-2">
          {state.status === "running" && <Loader2 className="h-4 w-4 animate-spin" />}
          {state.status === "success" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
          {state.status === "error" && <XCircle className="h-4 w-4 text-red-600" />}
          <AlertDescription>
            {state.status === "running" && "Running..."}
            {state.status === "success" && `Success! ${state.affected || 0} items affected.`}
            {state.status === "error" && `Error: ${state.error}`}
          </AlertDescription>
        </div>
      </Alert>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Recompute Leaderboards */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle>Recompute Leaderboards</CardTitle>
          </div>
          <CardDescription>Recalculate friend leaderboard rankings and positions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="leaderboard-household">Household ID (optional)</Label>
            <Input
              id="leaderboard-household"
              placeholder="Leave empty for global"
              value={selectedHouseholdId}
              onChange={(e) => setSelectedHouseholdId(e.target.value)}
            />
          </div>

          <Dialog open={dialogOpen === "recompute_leaderboards"} onOpenChange={(open) => !open && setDialogOpen(null)}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setDialogOpen("recompute_leaderboards")}
                disabled={jobs.recompute_leaderboards.status === "running"}
                className="w-full"
              >
                {jobs.recompute_leaderboards.status === "running" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  "Run Job"
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Job Execution</DialogTitle>
                <DialogDescription>
                  This will recompute leaderboards for{" "}
                  {selectedHouseholdId ? "the specified household" : "all households"}. This operation is idempotent and
                  safe to run multiple times.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const scope = selectedHouseholdId ? "household" : "global"
                    const params = selectedHouseholdId ? { householdId: selectedHouseholdId } : {}
                    runJob("recompute_leaderboards", scope, params)
                  }}
                >
                  Confirm & Run
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {renderJobStatus("recompute_leaderboards")}
        </CardContent>
      </Card>

      {/* Recompute Streaks */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <CardTitle>Recompute Streaks</CardTitle>
          </div>
          <CardDescription>Recalculate daily completion streaks for all children</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="streak-household">Household ID (optional)</Label>
            <Input
              id="streak-household"
              placeholder="Leave empty for global"
              value={selectedHouseholdId}
              onChange={(e) => setSelectedHouseholdId(e.target.value)}
            />
          </div>

          <Dialog open={dialogOpen === "recompute_streaks"} onOpenChange={(open) => !open && setDialogOpen(null)}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setDialogOpen("recompute_streaks")}
                disabled={jobs.recompute_streaks.status === "running"}
                className="w-full"
              >
                {jobs.recompute_streaks.status === "running" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  "Run Job"
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Job Execution</DialogTitle>
                <DialogDescription>
                  This will recalculate streaks based on actual task completion history for{" "}
                  {selectedHouseholdId ? "the specified household" : "all children"}. This operation is idempotent.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const scope = selectedHouseholdId ? "household" : "global"
                    const params = selectedHouseholdId ? { householdId: selectedHouseholdId } : {}
                    runJob("recompute_streaks", scope, params)
                  }}
                >
                  Confirm & Run
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {renderJobStatus("recompute_streaks")}
        </CardContent>
      </Card>

      {/* Regenerate Weekly Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" />
            <CardTitle>Regenerate Weekly Summary</CardTitle>
          </div>
          <CardDescription>Send weekly summary email to a specific household</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="summary-household">Household ID (required)</Label>
            <Input
              id="summary-household"
              placeholder="Enter household ID"
              value={selectedHouseholdId}
              onChange={(e) => setSelectedHouseholdId(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="use-ai">Use AI Insights</Label>
              <p className="text-sm text-muted-foreground">Generate AI-powered suggestions</p>
            </div>
            <Switch id="use-ai" checked={useAI} onCheckedChange={setUseAI} />
          </div>

          <Dialog
            open={dialogOpen === "regenerate_weekly_summary"}
            onOpenChange={(open) => !open && setDialogOpen(null)}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => setDialogOpen("regenerate_weekly_summary")}
                disabled={!selectedHouseholdId || jobs.regenerate_weekly_summary.status === "running"}
                className="w-full"
              >
                {jobs.regenerate_weekly_summary.status === "running" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  "Run Job"
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Job Execution</DialogTitle>
                <DialogDescription>
                  This will generate and send a weekly summary email to the parent(s) in household {selectedHouseholdId}
                  .
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    runJob("regenerate_weekly_summary", "household", {
                      householdId: selectedHouseholdId,
                      useAI,
                    })
                  }}
                >
                  Confirm & Run
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {renderJobStatus("regenerate_weekly_summary")}
        </CardContent>
      </Card>

      {/* Replay Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-500" />
            <CardTitle>Replay Notifications</CardTitle>
          </div>
          <CardDescription>Resend notifications for a time window (bounded)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="replay-household">Household ID (required)</Label>
            <Input
              id="replay-household"
              placeholder="Enter household ID"
              value={selectedHouseholdId}
              onChange={(e) => setSelectedHouseholdId(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from-date">From Date</Label>
              <Input id="from-date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-date">To Date</Label>
              <Input id="to-date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Maximum 7-day window allowed to prevent spam</AlertDescription>
          </Alert>

          <Dialog open={dialogOpen === "replay_notifications"} onOpenChange={(open) => !open && setDialogOpen(null)}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setDialogOpen("replay_notifications")}
                disabled={
                  !selectedHouseholdId || !fromDate || !toDate || jobs.replay_notifications.status === "running"
                }
                className="w-full"
              >
                {jobs.replay_notifications.status === "running" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  "Run Job"
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Job Execution</DialogTitle>
                <DialogDescription>
                  This will replay notifications for household {selectedHouseholdId} from {fromDate} to {toDate}. Use
                  with caution.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    runJob("replay_notifications", "household", {
                      householdId: selectedHouseholdId,
                      fromDate,
                      toDate,
                    })
                  }}
                >
                  Confirm & Run
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {renderJobStatus("replay_notifications")}
        </CardContent>
      </Card>
    </div>
  )
}
