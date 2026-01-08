"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { User, Shield, Calendar, Activity, AlertTriangle, RefreshCw, Ban, CheckCircle, Home } from "lucide-react"
import {
  updateUserNicknameAction,
  updateUserAgeBandAction,
  resetUserAvatarAction,
  updateUserStatusAction,
  relinkChildToHouseholdAction,
} from "@/app/actions/admin-user-actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface UserDetailClientProps {
  user: any
}

export function UserDetailClient({ user }: UserDetailClientProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [nickname, setNickname] = useState(user.nickname || user.display_name || "")
  const [ageBand, setAgeBand] = useState(user.age_band || "")
  const [newHouseholdId, setNewHouseholdId] = useState("")

  const handleUpdateNickname = async () => {
    setIsUpdating(true)
    const result = await updateUserNicknameAction(user.id, nickname)
    setIsUpdating(false)

    if (result.success) {
      toast.success("Nickname updated successfully")
      router.refresh()
    } else {
      toast.error(result.error || "Failed to update nickname")
    }
  }

  const handleUpdateAgeBand = async () => {
    setIsUpdating(true)
    const result = await updateUserAgeBandAction(user.id, ageBand)
    setIsUpdating(false)

    if (result.success) {
      toast.success("Age band updated successfully")
      router.refresh()
    } else {
      toast.error(result.error || "Failed to update age band")
    }
  }

  const handleResetAvatar = async () => {
    setIsUpdating(true)
    const result = await resetUserAvatarAction(user.id)
    setIsUpdating(false)

    if (result.success) {
      toast.success("Avatar reset successfully")
      router.refresh()
    } else {
      toast.error(result.error || "Failed to reset avatar")
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    setIsUpdating(true)
    const result = await updateUserStatusAction(user.id, newStatus)
    setIsUpdating(false)

    if (result.success) {
      toast.success(`User ${newStatus === "active" ? "enabled" : "disabled"} successfully`)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to update status")
    }
  }

  const handleRelinkChild = async () => {
    if (!newHouseholdId.trim()) {
      toast.error("Please enter a household ID")
      return
    }

    setIsUpdating(true)
    const result = await relinkChildToHouseholdAction(user.id, newHouseholdId.trim())
    setIsUpdating(false)

    if (result.success) {
      toast.success("Child relinked successfully")
      router.refresh()
    } else {
      toast.error(result.error || "Failed to relink child")
    }
  }

  return (
    <div className="space-y-6">
      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Information
          </CardTitle>
          <CardDescription>Basic user profile and account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">User ID</Label>
              <p className="font-mono text-sm">{user.id}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Clerk User ID</Label>
              <p className="font-mono text-sm">{user.clerk_user_id || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Role</Label>
              <div className="mt-1">
                <Badge variant={user.role === "parent" ? "default" : "secondary"}>
                  <Shield className="h-3 w-3 mr-1" />
                  {user.role}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-1">
                <Badge variant={user.status === "active" ? "default" : "destructive"}>
                  {user.status === "active" ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <Ban className="h-3 w-3 mr-1" />
                  )}
                  {user.status || "active"}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Household</Label>
              <p className="text-sm">{user.household_name}</p>
              <p className="font-mono text-xs text-muted-foreground">{user.household_id}</p>
            </div>
            {user.role === "child" && (
              <div>
                <Label className="text-muted-foreground">Age Band</Label>
                <p className="text-sm">{user.age_band || "Not set"}</p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">Nickname/Display Name</Label>
              <p className="text-sm">{user.nickname || user.display_name || "Not set"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Avatar</Label>
              <p className="text-2xl">{user.avatar_url || "👤"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Created At</Label>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <p className="text-sm">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Last Activity</Label>
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                <p className="text-sm">
                  {user.last_activity ? new Date(user.last_activity).toLocaleDateString() : "No activity"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Admin Actions
          </CardTitle>
          <CardDescription>Perform administrative operations on this user account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Update Nickname */}
          <div className="space-y-2">
            <Label>Update {user.role === "child" ? "Nickname" : "Display Name"}</Label>
            <div className="flex gap-2">
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={user.role === "child" ? "Enter nickname" : "Enter display name"}
              />
              <Dialog>
                <DialogTrigger asChild>
                  <Button disabled={!nickname.trim() || isUpdating}>Update</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Nickname Update</DialogTitle>
                    <DialogDescription>
                      This will change the user's {user.role === "child" ? "nickname" : "display name"} to "{nickname}".
                      This action will be logged.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setNickname(user.nickname || user.display_name || "")}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateNickname} disabled={isUpdating}>
                      Confirm Update
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Update Age Band (Child Only) */}
          {user.role === "child" && (
            <div className="space-y-2">
              <Label>Update Age Band</Label>
              <div className="flex gap-2">
                <Select value={ageBand} onValueChange={setAgeBand}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select age band" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5-7">5-7 years</SelectItem>
                    <SelectItem value="8-10">8-10 years</SelectItem>
                    <SelectItem value="11-13">11-13 years</SelectItem>
                    <SelectItem value="14-16">14-16 years</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button disabled={!ageBand || isUpdating}>Update</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Age Band Update</DialogTitle>
                      <DialogDescription>
                        This will change the child's age band to {ageBand}. This action will be logged.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAgeBand(user.age_band || "")}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateAgeBand} disabled={isUpdating}>
                        Confirm Update
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}

          {/* Reset Avatar */}
          <div className="space-y-2">
            <Label>Reset Avatar</Label>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={isUpdating}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Avatar Reset</DialogTitle>
                  <DialogDescription>
                    This will reset the user's avatar to the default placeholder. This action will be logged.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button onClick={handleResetAvatar} disabled={isUpdating}>
                    Confirm Reset
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Enable/Disable User */}
          <div className="space-y-2">
            <Label>Account Status</Label>
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={user.status === "active" || isUpdating}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Enable User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm User Enable</DialogTitle>
                    <DialogDescription>
                      This will set the user status to active, allowing them to use the app. This action will be logged.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button onClick={() => handleUpdateStatus("active")} disabled={isUpdating}>
                      Confirm Enable
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" disabled={user.status === "disabled" || isUpdating}>
                    <Ban className="h-4 w-4 mr-2" />
                    Disable User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm User Disable</DialogTitle>
                    <DialogDescription>
                      This will set the user status to disabled, preventing them from using the app. This action will be
                      logged.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button variant="destructive" onClick={() => handleUpdateStatus("disabled")} disabled={isUpdating}>
                      Confirm Disable
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Relink Child to Household (Child Only) */}
          {user.role === "child" && (
            <div className="space-y-2">
              <Label>Relink to Different Household</Label>
              <p className="text-sm text-muted-foreground mb-2">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                Use with extreme caution. This will move the child to a different household.
              </p>
              <div className="flex gap-2">
                <Input
                  value={newHouseholdId}
                  onChange={(e) => setNewHouseholdId(e.target.value)}
                  placeholder="Enter new household ID"
                  className="font-mono"
                />
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" disabled={!newHouseholdId.trim() || isUpdating}>
                      <Home className="h-4 w-4 mr-2" />
                      Relink
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>⚠️ Confirm Child Relink</DialogTitle>
                      <DialogDescription>
                        This will move the child from household "{user.household_name}" to a new household. All
                        associated data (tasks, points, friendships) will remain but under the new household context.
                        This is a critical operation and will be audited.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewHouseholdId("")}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleRelinkChild} disabled={isUpdating}>
                        I Understand, Proceed
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consent Records (Child Only) */}
      {user.role === "child" && user.consent_records && user.consent_records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Consent Records</CardTitle>
            <CardDescription>Parental consent history for this child</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Granted At</TableHead>
                  <TableHead>Granted By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.consent_records.map((consent: any) => (
                  <TableRow key={consent.id}>
                    <TableCell>{consent.consent_type}</TableCell>
                    <TableCell>{consent.consent_version}</TableCell>
                    <TableCell>{new Date(consent.granted_at).toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs">{consent.granted_by_user_id}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Change History */}
      {user.audit_logs && user.audit_logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Change History</CardTitle>
            <CardDescription>Recent admin actions on this user</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.audit_logs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">{new Date(log.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action_type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{log.actor_email}</TableCell>
                    <TableCell className="text-xs">
                      {log.before_json && (
                        <span className="text-muted-foreground">
                          Before: {JSON.stringify(log.before_json).substring(0, 50)}...
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
