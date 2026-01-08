"use client"

import { UserButton } from "@clerk/nextjs"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import type { AdminUser } from "@/lib/adminAuth"

interface AdminHeaderProps {
  admin: AdminUser
}

export function AdminHeader({ admin }: AdminHeaderProps) {
  const environment = process.env.NODE_ENV === "production" ? "Production" : "Development"
  const envColor = environment === "Production" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <div className="flex flex-1 items-center gap-2">
        <span className={`rounded-md px-2 py-1 text-xs font-medium ${envColor}`}>{environment}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden text-right md:block">
          <p className="text-sm font-medium">{admin.name}</p>
          <p className="text-xs text-muted-foreground">{admin.email}</p>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  )
}
