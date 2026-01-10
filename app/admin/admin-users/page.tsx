import { requireAdmin, getAdminIdentity } from "@/lib/adminAuth"
import { listAdmins, countAdmins } from "@/lib/db/repositories/adminUsers"
import { AdminUsersClient } from "@/components/admin/admin-users-client"

export default async function AdminUsersPage() {
  // Try to get admin identity - if it fails, show bootstrap UI
  const adminIdentity = await getAdminIdentity()

  // If not an admin, check if bootstrap mode is needed
  if (!adminIdentity) {
    const adminCount = await countAdmins()
    if (adminCount === 0) {
      // Bootstrap mode - allow eligible users to become first admin
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin User Bootstrap</h1>
            <p className="text-muted-foreground">No admins exist. Set up the first admin account.</p>
          </div>

          <AdminUsersClient initialAdmins={[]} initialCount={0} isBootstrapMode={true} />
        </div>
      )
    }

    // Admins exist but user is not authorized
    await requireAdmin() // This will throw and redirect
  }

  // Regular admin mode - show admin users management
  const admins = await listAdmins()
  const totalCount = await countAdmins()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Users</h1>
        <p className="text-muted-foreground">Manage admin access and user promotion</p>
      </div>

      <AdminUsersClient initialAdmins={admins} initialCount={totalCount} />
    </div>
  )
}
