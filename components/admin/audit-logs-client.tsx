"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { getAuditLogsAction } from "@/app/actions/admin-audit-actions"
import type { AdminAuditLog, AdminActionType, AdminEntityType } from "@/lib/db/types"
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { redactSensitiveData } from "@/lib/admin/redaction"

const ACTION_TYPES: AdminActionType[] = [
  "UPDATE_USER",
  "DISABLE_USER",
  "ENABLE_USER",
  "UPDATE_HOUSEHOLD",
  "UPDATE_TEMPLATE",
  "CREATE_TEMPLATE",
  "UPDATE_BADGE",
  "CREATE_BADGE",
  "UPDATE_FLAG",
  "CREATE_FLAG",
  "RUN_JOB",
]

const ENTITY_TYPES: AdminEntityType[] = ["user", "household", "quest_template", "badge", "feature_flag", "job"]

export function AuditLogsClient() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Filters
  const [actorEmail, setActorEmail] = useState("")
  const [actionType, setActionType] = useState<AdminActionType | "all">("all")
  const [entityType, setEntityType] = useState<AdminEntityType | "all">("all")
  const [entityId, setEntityId] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const LIMIT = 50

  const loadLogs = async () => {
    setLoading(true)

    try {
      const result = await getAuditLogsAction({
        filters: {
          ...(actorEmail && { actor_admin_user_id: actorEmail }),
          ...(actionType !== "all" && { action_type: actionType }),
          ...(entityType !== "all" && { entity_type: entityType }),
          ...(entityId && { entity_id: entityId }),
          ...(fromDate && { from_date: fromDate }),
          ...(toDate && { to_date: toDate }),
        },
        limit: LIMIT,
        offset: (page - 1) * LIMIT,
      })

      setLogs(result.logs)
      setTotal(result.total)
    } catch (error) {
      console.error("[v0] Failed to load audit logs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [page])

  const handleFilter = () => {
    setPage(1)
    loadLogs()
  }

  const handleReset = () => {
    setActorEmail("")
    setActionType("all")
    setEntityType("all")
    setEntityId("")
    setFromDate("")
    setToDate("")
    setPage(1)
    loadLogs()
  }

  const viewLogDetail = (log: AdminAuditLog) => {
    setSelectedLog(log)
    setSheetOpen(true)
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter audit logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="actor-email">Actor Email</Label>
              <Input
                id="actor-email"
                placeholder="admin@example.com"
                value={actorEmail}
                onChange={(e) => setActorEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="action-type">Action Type</Label>
              <Select value={actionType} onValueChange={(value) => setActionType(value as any)}>
                <SelectTrigger id="action-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {ACTION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity-type">Entity Type</Label>
              <Select value={entityType} onValueChange={(value) => setEntityType(value as any)}>
                <SelectTrigger id="entity-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {ENTITY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity-id">Entity ID</Label>
              <Input
                id="entity-id"
                placeholder="Optional"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="from-date">From Date</Label>
              <Input id="from-date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-date">To Date</Label>
              <Input id="to-date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={handleFilter}>Apply Filters</Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Log Entries</CardTitle>
          <CardDescription>
            {total} total entries, showing page {page} of {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSkeleton count={5} height={60} />
          ) : logs.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ScrollText className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>No audit logs found</EmptyTitle>
                <EmptyDescription>
                  No logs match your current filters. Try adjusting your date range or filter criteria.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity Type</TableHead>
                      <TableHead>Entity ID</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow
                        key={log.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => viewLogDetail(log)}
                      >
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.created_at), "MMM dd, HH:mm:ss")}
                        </TableCell>
                        <TableCell className="text-sm">{log.actor_email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{log.entity_type}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.entity_id.slice(0, 8)}...</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {selectedLog && (
            <>
              <SheetHeader>
                <SheetTitle>Audit Log Detail</SheetTitle>
                <SheetDescription>View complete audit log entry with before/after states</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="grid gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Timestamp</Label>
                    <p className="font-mono text-sm">{format(new Date(selectedLog.created_at), "PPpp")}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Actor</Label>
                    <p className="text-sm">{selectedLog.actor_email}</p>
                    <p className="font-mono text-xs text-muted-foreground">{selectedLog.actor_admin_user_id}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Action</Label>
                    <Badge variant="outline">{selectedLog.action_type}</Badge>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Entity</Label>
                    <p className="text-sm">
                      <Badge variant="secondary">{selectedLog.entity_type}</Badge>
                      <span className="ml-2 font-mono text-xs">{selectedLog.entity_id}</span>
                    </p>
                  </div>
                </div>

                {selectedLog.before_json && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Before State</Label>
                    <pre className="mt-2 rounded-lg bg-muted p-4 text-xs overflow-x-auto">
                      {JSON.stringify(redactSensitiveData(selectedLog.before_json), null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.after_json && (
                  <div>
                    <Label className="text-xs text-muted-foreground">After State</Label>
                    <pre className="mt-2 rounded-lg bg-muted p-4 text-xs overflow-x-auto">
                      {JSON.stringify(redactSensitiveData(selectedLog.after_json), null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.metadata && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Metadata</Label>
                    <pre className="mt-2 rounded-lg bg-muted p-4 text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
