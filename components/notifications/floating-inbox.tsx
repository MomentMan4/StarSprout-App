"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import { haptics } from "@/lib/haptics"

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
    pathname?.startsWith("/legal") ||
    pathname?.startsWith("/onboarding")

  if (!user || isPublicRoute) {
    return null
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleOpen = () => {
    haptics.tap()
    setIsOpen(!isOpen)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          size="lg"
          onClick={handleOpen}
          className="relative h-14 w-14 rounded-full shadow-lg"
          aria-label="Notifications"
        >
          <Bell className="h-6 w-6" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -right-1 -top-1"
              >
                <Badge className="h-6 w-6 rounded-full bg-red-500 p-0 text-xs">{unreadCount}</Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0"
          >
            <Card className="w-80 shadow-xl">
              <div className="border-b p-4">
                <h3 className="font-semibold">Notifications</h3>
                <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
              </div>
              <ScrollArea className="h-96">
                {notifications.length > 0 ? (
                  <div className="space-y-1 p-2">
                    {notifications.map((notif) => (
                      <motion.div
                        key={notif.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => haptics.tap()}
                        className={`rounded-lg p-3 cursor-pointer hover:bg-accent ${!notif.read ? "bg-blue-50" : ""}`}
                      >
                        <p className="text-sm font-medium">{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notif.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">No notifications yet</div>
                )}
              </ScrollArea>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
