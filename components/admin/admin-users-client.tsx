"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { Shield, UserPlus, UserMinus, AlertTriangle, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import {
  listAdminUsersAction,
  promoteAdminAction,
  demoteAdminAction,
  checkBootstrapEligibilityAction,
  bootstrapSelfPromotionAction,
} from "@/app/actions/admin-user-promotion-actions"
import { format } from "date-fns"

interface AdminUser {
  userId: string
  email: string
  name: string
  imageUrl?: string
  createdAt: string
}

interface AdminUsersClientProps {
  initialAdmins: AdminUser[]
  initialCount: number
  isBootstrapMode?: boolean
}

export function AdminUsersClient({ initialAdmins, initialCount, isBootstrapMode = false }: AdminUsersClientProps) {
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins)
  const [totalCount, setTotalCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const [promoteEmail, setPromoteEmail] = useState("")
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false)
  const [demoteTarget, setDemoteTarget] = useState<AdminUser | null>(null)
  const [bootstrapEligibility, setBootstrapEligibility] = useState<{
    eligible: boolean
    reason?: string
    userEmail?: string
  } | null>(null)

  // Check bootstrap eligibility if in bootstrap mode
  useEffect(() => {
    if (isBootstrapMode) {
      checkBootstrapEligibilityAction().then(setBootstrapEligibility)
    }
  }, [isBootstrapMode])

  const refreshAdmins = async () => {
    setLoading(true)
    try {
      const result = await listAdminUsersAction()
      if (result.success) {
        setAdmins(result.admins)
        setTotalCount(result.totalCount)
      }
    } catch (error) {
      console.error("[v0] Failed to refresh admins:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePromote = async () => {
    if (!promoteEmail.trim()) {
      toast.error("Please enter an email address")
      return
    }

    setLoading(true)
    try {
      const result = await promoteAdminAction(promoteEmail.trim())

      if (result.success) {
        toast.success("User promoted to admin successfully")
        setPromoteEmail("")
        setPromoteDialogOpen(false)
        await refreshAdmins()
      } else {
        toast.error(result.error || "Failed to promote user")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleDemote = async () => {
    if (!demoteTarget) return

    setLoading(true)
    try {
      const result = await demoteAdminAction(demoteTarget.email)

      if (result.success) {
        toast.success("Admin demoted successfully")
        setDemoteTarget(null)
        await refreshAdmins()
      } else {
        toast.error(result.error || "Failed to demote admin")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleBootstrapSelfPromotion = async () => {
    setLoading(true)
    try {
      const result = await bootstrapSelfPromotionAction()

      if (result.success) {
        toast.success("You have been promoted to admin. Redirecting...")
        setTimeout(() => {
          window.location.href = "/admin"
        }, 1500)
      } else {
        toast.error(result.error || "Failed to bootstrap admin")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Bootstrap mode UI
  if (isBootstrapMode) {
    if (!bootstrapEligibility) {
      return <LoadingSkeleton count={1} height={200} />
    }

    if (!bootstrapEligibility.eligible) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Bootstrap Not Available
            </CardTitle>
            <CardDescription>You cannot bootstrap the first admin account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-900">
                  <strong>Reason:</strong> {bootstrapEligibility.reason}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Bootstrap Requirements:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>There must be zero admins in the system</li>
                  <li>Your email must be in the ADMIN_EMAIL_ALLOWLIST environment variable</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Bootstrap First Admin
          </CardTitle>
          <CardDescription>You are eligible to become the first admin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-900">
                <strong>Your Email:</strong> {bootstrapEligibility.userEmail}
              </p>
              <p className="text-sm text-green-900 mt-2">
                You are in the admin allowlist and there are no existing admins. You can promote yourself to admin.
              </p>
            </div>

            <AlertDialog>
              <Button onClick={handleBootstrapSelfPromotion} disabled={loading} className="w-full">
                <Shield className="mr-2 h-4 w-4" />
                {loading ? "Promoting..." : "Become First Admin"}
              </Button>
            </AlertDialog>

            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">What happens next:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your Clerk privateMetadata will be updated with role: "admin"</li>
                <li>This action will be logged in the audit trail</li>
                <li>You'll be redirected to the admin dashboard</li>
                <li>You can then promote other admins from the allowlist</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Regular admin management UI
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Users Overview
          </CardTitle>
          <CardDescription>Manage admin access and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Admins</p>
              <p className="text-3xl font-bold">{totalCount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Allowlist</p>
              <p className="text-sm">Configured via env var</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Safety Rule</p>
              <p className="text-sm">Cannot demote last admin</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Promote Admin */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Promote Admin
          </CardTitle>
          <CardDescription>Add a new admin user by email (must be in allowlist)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="promote-email" className="sr-only">
                Email Address
              </Label>
              <Input
                id="promote-email"
                type="email"
                placeholder="admin@example.com"
                value={promoteEmail}
                onChange={(e) => setPromoteEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <Dialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!promoteEmail.trim() || loading}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Promote
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Admin Promotion</DialogTitle>
                  <DialogDescription>
                    This will promote <strong>{promoteEmail}</strong> to admin. They will have full access to the admin
                    panel and can manage all households, users, and system settings.
                  </DialogDescription>
                </DialogHeader>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm text-amber-900">
                    <AlertTriangle className="inline h-4 w-4 mr-1" />
                    The user's email must be in the ADMIN_EMAIL_ALLOWLIST environment variable. This action will be
                    logged in the audit trail.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPromoteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handlePromote} disabled={loading}>
                    {loading ? "Promoting..." : "Confirm Promotion"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Admin Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Admin Users ({totalCount})</CardTitle>
          <CardDescription>All users with admin access</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && admins.length === 0 ? (
            <LoadingSkeleton count={3} height={60} />
          ) : admins.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Shield className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>No admin users found</EmptyTitle>
                <EmptyDescription>There are currently no admin users in the system.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Added At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.userId}>
                      <TableCell className="font-medium">{admin.name}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell className="font-mono text-xs">{admin.userId.slice(0, 12)}...</TableCell>
                      <TableCell className="text-sm">{format(new Date(admin.createdAt), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant="default">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDemoteTarget(admin)}
                          disabled={loading || totalCount === 1}
                          title={totalCount === 1 ? "Cannot demote the last admin" : "Demote admin"}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demote Confirmation Dialog */}
      <AlertDialog open={!!demoteTarget} onOpenChange={(open) => !open && setDemoteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Admin Demotion
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will demote <strong>{demoteTarget?.name}</strong> ({demoteTarget?.email}) from admin to regular user.
              They will lose all admin privileges immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-900">
              This action will be logged in the audit trail and cannot be undone without re-promotion.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDemote}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? "Demoting..." : "Confirm Demotion"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
