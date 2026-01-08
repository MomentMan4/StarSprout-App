"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Users, CheckCircle2, XCircle, Clock } from "lucide-react"
import { approveFriendRequestAction, denyFriendRequestAction } from "@/app/actions/social-actions"
import { motion, AnimatePresence } from "framer-motion"
import { haptic } from "@/lib/haptics"
import { fadeIn, cardPress, ctaSuccessPulse } from "@/lib/motion"

interface ParentSocialClientProps {
  user: any
  pendingRequests: any[]
  approvedFriendships: any[]
}

export function ParentSocialClient({ user, pendingRequests, approvedFriendships }: ParentSocialClientProps) {
  const [processing, setProcessing] = useState<string | null>(null)

  const handleApprove = async (friendshipId: string) => {
    setProcessing(friendshipId)
    await approveFriendRequestAction(friendshipId, user.id)
    haptic("SUCCESS")
    setProcessing(null)
  }

  const handleDeny = async (friendshipId: string) => {
    setProcessing(friendshipId)
    await denyFriendRequestAction(friendshipId)
    haptic("TAP")
    setProcessing(null)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">StarSprout</h1>
          </div>
          <nav className="flex gap-4">
            <Link href="/parent/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/parent/quests">
              <Button variant="ghost">Quests</Button>
            </Link>
            <Link href="/parent/rewards">
              <Button variant="ghost">Rewards</Button>
            </Link>
            <Link href="/parent/social">
              <Button variant="ghost" className="underline">
                Social
              </Button>
            </Link>
            <Link href="/parent/settings">
              <Button variant="ghost">Settings</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto flex-1 p-6 max-w-6xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Social & Friends</h2>
          <p className="text-muted-foreground">Manage your children's friend connections</p>
        </div>

        {/* Pending Approvals */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Pending Friend Requests
              {pendingRequests.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingRequests.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Review and approve friend connections for your children</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRequests.length > 0 ? (
              <AnimatePresence mode="popLayout">
                <div className="space-y-4">
                  {pendingRequests.map((request: any) => (
                    <motion.div
                      key={request.id}
                      variants={fadeIn}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                      layout
                      className="flex items-center justify-between p-4 rounded-lg border bg-amber-50 border-amber-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-xl font-bold">
                            {request.child?.nickname.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold">{request.child?.nickname}</p>
                            <p className="text-sm text-muted-foreground">Your child</p>
                          </div>
                        </div>

                        <span className="text-2xl">➔</span>

                        <div className="flex items-center gap-2">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-400 rounded-full flex items-center justify-center text-xl font-bold">
                            {request.friend?.nickname.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold">{request.friend?.nickname}</p>
                            <p className="text-sm text-muted-foreground">Wants to be friends</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <motion.div whileTap={cardPress} whileHover={ctaSuccessPulse}>
                          <Button
                            onClick={() => handleApprove(request.id)}
                            disabled={processing === request.id}
                            variant="default"
                            size="sm"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </motion.div>
                        <motion.div whileTap={cardPress}>
                          <Button
                            onClick={() => handleDeny(request.id)}
                            disabled={processing === request.id}
                            variant="outline"
                            size="sm"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Deny
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            ) : (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">No pending requests</p>
                <p className="text-sm text-muted-foreground">Friend requests will appear here for your approval</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approved Friends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Approved Friendships
            </CardTitle>
            <CardDescription>Recently approved friend connections</CardDescription>
          </CardHeader>
          <CardContent>
            {approvedFriendships.length > 0 ? (
              <div className="space-y-3">
                {approvedFriendships.map((friendship: any) => (
                  <div key={friendship.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">✅</div>
                      <div>
                        <p className="font-medium">
                          {friendship.child?.nickname} ↔ {friendship.friend?.nickname}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Approved {new Date(friendship.approved_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No approved friendships yet</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
