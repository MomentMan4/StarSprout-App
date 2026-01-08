"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

// Mock notification data for MVP
const mockNotifications = [
  {
    id: "1",
    title: "Quest Approved! ✅",
    content: 'Great job on "Make your bed"! You earned 10 points!',
    category: "Quests",
    read: false,
    createdAt: new Date().toISOString(),
  },
]

export function FloatingInbox() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications] = useState(mockNotifications)
  const pathname = usePathname()
  const { user } = useUser()

  const isPublicRoute =
    pathname === "/" ||
    pathname?.startsWith("/sign-in") ||
    pathname?.startsWith("/sign-up") ||
    pathname?.startsWith("/legal")

  if (!user || isPublicRoute) {
    return null
  }
  // </CHANGE>

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        size="lg"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-14 w-14 rounded-full shadow-lg"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <Badge className="absolute -right-1 -top-1 h-6 w-6 rounded-full bg-red-500 p-0 text-xs">{unreadCount}</Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-80 shadow-xl">
          <div className="border-b p-4">
            <h3 className="font-semibold">Notifications</h3>
            <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
          </div>
          <ScrollArea className="h-96">
            {notifications.length > 0 ? (
              <div className="space-y-1 p-2">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`rounded-lg p-3 hover:bg-accent ${!notif.read ? "bg-blue-50" : ""}`}>
                    <p className="text-sm font-medium">{notif.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notif.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">{new Date(notif.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">No notifications yet</div>
            )}
          </ScrollArea>
        </Card>
      )}
    </div>
  )
}
