"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Flag, Plus, Pencil, AlertTriangle, Zap, Users } from "lucide-react"
import { createFlag, updateFlag, quickDisableAI, quickDisableSocial } from "@/app/actions/admin-flag-actions"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import type { FeatureFlagNew } from "@/lib/db/types"

export function FeatureFlagsClient({ flags }: { flags: FeatureFlagNew[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedScope, setSelectedScope] = useState<string>("all")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingFlag, setEditingFlag] = useState<FeatureFlagNew | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ type: string; action: () => void } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Filter flags
  const filteredFlags = flags.filter((flag) => {
    const matchesSearch = flag.key.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesScope = selectedScope === "all" || flag.scope_type === selectedScope
    return matchesSearch && matchesScope
  })

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">AI Features</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              size="sm"
              onClick={() =>
                setConfirmAction({
                  type: "disable-ai",
                  action: async () => {
                    await quickDisableAI()
                    window.location.reload()
                  },
                })
              }
            >
              <Zap className="mr-2 h-4 w-4" />
              Disable AI Globally
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Social Features</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              size="sm"
              onClick={() =>
                setConfirmAction({
                  type: "disable-social",
                  action: async () => {
                    await quickDisableSocial()
                    window.location.reload()
                  },
                })
              }
            >
              <Users className="mr-2 h-4 w-4" />
              Disable Social Globally
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Search flags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select value={selectedScope} onValueChange={setSelectedScope}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scopes</SelectItem>
              <SelectItem value="global">Global</SelectItem>
              <SelectItem value="household">Household</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Flag
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <FlagForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feature Flags ({filteredFlags.length})</CardTitle>
          <CardDescription>Manage feature toggles and safety switches</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSkeleton count={5} height={60} />
          ) : filteredFlags.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Flag className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>No feature flags found</EmptyTitle>
                <EmptyDescription>Try adjusting your search filters or create a new flag</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Scope ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFlags.map((flag) => (
                  <TableRow key={flag.id}>
                    <TableCell className="font-mono text-sm">{flag.key}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{flag.scope_type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{flag.scope_id || "—"}</TableCell>
                    <TableCell>
                      {flag.enabled ? (
                        <Badge variant="default">Enabled</Badge>
                      ) : (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs">
                      {flag.value_json ? JSON.stringify(flag.value_json) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(flag.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setEditingFlag(flag)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <FlagForm flag={flag} onSuccess={() => setEditingFlag(null)} />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Critical Action
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "disable-ai" &&
                "This will disable all AI features globally. Users will not receive AI-powered messages, suggestions, or summaries. Are you sure?"}
              {confirmAction?.type === "disable-social" &&
                "This will disable all social features globally. Users will not be able to send friend requests or view leaderboards. Are you sure?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmAction?.action()
                setConfirmAction(null)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function FlagForm({ flag, onSuccess }: { flag?: FeatureFlagNew; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [key, setKey] = useState(flag?.key || "")
  const [scopeType, setScopeType] = useState(flag?.scope_type || "global")
  const [scopeId, setScopeId] = useState(flag?.scope_id || "")
  const [enabled, setEnabled] = useState(flag?.enabled ?? true)
  const [valueJson, setValueJson] = useState(flag?.value_json ? JSON.stringify(flag.value_json, null, 2) : "")
  const [jsonError, setJsonError] = useState("")

  const knownKeys = [
    "ai.enabled",
    "ai.daily_cap",
    "social.enabled",
    "notifications.enabled",
    "rewards.enabled",
    "leaderboard.enabled",
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setJsonError("")

    try {
      let parsedValue = null
      if (valueJson.trim()) {
        try {
          parsedValue = JSON.parse(valueJson)
        } catch {
          setJsonError("Invalid JSON format")
          setLoading(false)
          return
        }
      }

      const data = {
        scope_type: scopeType as "global" | "household" | "user",
        scope_id: scopeId || null,
        key,
        enabled,
        value_json: parsedValue,
      }

      if (flag) {
        await updateFlag(flag.id, data)
      } else {
        await createFlag(data)
      }

      onSuccess()
      window.location.reload()
    } catch (error) {
      console.error("[v0] Error saving flag:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{flag ? "Edit Feature Flag" : "Create Feature Flag"}</DialogTitle>
        <DialogDescription>{flag ? "Update flag configuration" : "Create a new feature flag"}</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <Label htmlFor="key">Flag Key</Label>
          <Select value={key || "custom"} onValueChange={(v) => v !== "custom" && setKey(v)}>
            <SelectTrigger id="key">
              <SelectValue placeholder="Select or enter custom key" />
            </SelectTrigger>
            <SelectContent>
              {knownKeys.map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom key...</SelectItem>
            </SelectContent>
          </Select>
          {(!knownKeys.includes(key) || !key) && (
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="custom.flag.key"
              className="mt-2"
              required
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="scope-type">Scope Type</Label>
            <Select value={scopeType} onValueChange={setScopeType}>
              <SelectTrigger id="scope-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="household">Household</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scopeType !== "global" && (
            <div>
              <Label htmlFor="scope-id">Scope ID</Label>
              <Input
                id="scope-id"
                value={scopeId}
                onChange={(e) => setScopeId(e.target.value)}
                placeholder="household or user ID"
                required={scopeType !== "global"}
              />
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
          <Label htmlFor="enabled">Flag is enabled</Label>
        </div>

        <div>
          <Label htmlFor="value-json">Value (JSON)</Label>
          <Textarea
            id="value-json"
            value={valueJson}
            onChange={(e) => {
              setValueJson(e.target.value)
              setJsonError("")
            }}
            placeholder='{"daily_cap": 10, "throttle": true}'
            rows={6}
            className="font-mono text-xs"
          />
          {jsonError && <p className="text-xs text-destructive mt-1">{jsonError}</p>}
          <p className="text-xs text-muted-foreground mt-1">Optional. Leave empty for simple boolean flags.</p>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : flag ? "Update Flag" : "Create Flag"}
          </Button>
        </div>
      </div>
    </form>
  )
}
