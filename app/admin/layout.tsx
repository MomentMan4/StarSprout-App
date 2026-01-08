import type React from "react"
import { redirect } from "next/navigation"
import { getAdminIdentity } from "@/lib/adminAuth"
import { AdminNav } from "@/components/admin/admin-nav"
import { AdminHeader } from "@/components/admin/admin-header"
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminIdentity()

  if (!admin) {
    redirect("/admin/unauthorized")
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <AdminNav />
      </Sidebar>
      <SidebarInset>
        <AdminHeader admin={admin} />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
