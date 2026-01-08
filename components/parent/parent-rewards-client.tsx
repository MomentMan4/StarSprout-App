"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, Clock } from "lucide-react"
import { CreateRewardSheet } from "./create-reward-sheet"
import { ApproveRedemptionDialog } from "./approve-redemption-dialog"
import { haptic } from "@/lib/haptics"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { fadeIn, cardPress } from "@/lib/motion"

interface ParentRewardsClientProps {
  user: any
  rewards: any[]
  pendingRedemptions: any[]
  history: any[]
}

export function ParentRewardsClient({ user, rewards, pendingRedemptions, history }: ParentRewardsClientProps) {
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [redemptionToApprove, setRedemptionToApprove] = useState<any | null>(null)

  const handleApproveClick = (redemption: any) => {
    setRedemptionToApprove(redemption)
    haptic("TAP")
  }

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <header className="border-b bg-background">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link href="/parent/dashboard">
              <h1 className="text-2xl font-bold text-indigo-600">StarSprout</h1>
            </Link>
            <nav className="flex gap-4">
              <Link href="/parent/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/parent/quests">
                <Button variant="ghost">Quests</Button>
              </Link>
              <Link href="/parent/rewards">
                <Button variant="default">Rewards</Button>
              </Link>
              <Link href="/parent/settings">
                <Button variant="ghost">Settings</Button>
              </Link>
            </nav>
          </div>
        </header>

        <main className="container mx-auto flex-1 p-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Rewards Management</h2>
              <p className="text-muted-foreground">Create rewards and manage redemptions</p>
            </div>
            <Button size="lg" onClick={() => setShowCreateSheet(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Reward
            </Button>
          </div>

          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList>
              <TabsTrigger value="pending">
                Pending Requests
                {pendingRedemptions.length > 0 && (
                  <Badge className="ml-2 bg-orange-500">{pendingRedemptions.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="catalog">Reward Catalog ({rewards.length})</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Reward Requests</CardTitle>
                  <CardDescription>Review and approve redemption requests from your children</CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingRedemptions.length > 0 ? (
                    <AnimatePresence mode="popLayout">
                      <div className="space-y-3">
                        {pendingRedemptions.map((redemption: any) => (
                          <motion.div
                            key={redemption.id}
                            variants={fadeIn}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, x: -20 }}
                            layout
                            className="flex items-center gap-4 p-4 rounded-lg border-2 border-orange-200 bg-orange-50"
                          >
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-2xl">
                              {redemption.child?.avatar_url || "👤"}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-lg">
                                {redemption.reward?.icon_emoji} {redemption.reward?.title}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {redemption.child?.nickname} • {redemption.points_spent} points •{" "}
                                <Clock className="inline h-3 w-3" />{" "}
                                {new Date(redemption.requested_at).toLocaleString()}
                              </p>
                            </div>
                            <motion.div whileTap={cardPress}>
                              <Button onClick={() => handleApproveClick(redemption)}>Review</Button>
                            </motion.div>
                          </motion.div>
                        ))}
                      </div>
                    </AnimatePresence>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-lg text-muted-foreground">No pending requests</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Children can request rewards when they have enough points
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="catalog">
              <Card>
                <CardHeader>
                  <CardTitle>Reward Catalog</CardTitle>
                  <CardDescription>All rewards available in your household</CardDescription>
                </CardHeader>
                <CardContent>
                  {rewards.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {rewards.map((reward) => (
                        <div key={reward.id} className="p-4 rounded-lg border bg-card">
                          <div className="flex items-start gap-3 mb-3">
                            <span className="text-3xl">{reward.icon_emoji || "🎁"}</span>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-lg">{reward.title}</h4>
                              {reward.description && (
                                <p className="text-sm text-muted-foreground mt-1">{reward.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="secondary">{reward.points_cost} points</Badge>
                            <Badge variant={reward.is_active ? "default" : "outline"}>
                              {reward.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-lg text-muted-foreground mb-4">No rewards created yet</p>
                      <Button onClick={() => setShowCreateSheet(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Reward
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Redemption History</CardTitle>
                  <CardDescription>Past reward requests and their outcomes</CardDescription>
                </CardHeader>
                <CardContent>
                  {history.length > 0 ? (
                    <div className="space-y-2">
                      {history.map((redemption: any) => (
                        <div key={redemption.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="text-2xl">{redemption.child?.avatar_url || "👤"}</div>
                            <div>
                              <p className="font-medium">
                                {redemption.reward?.icon_emoji} {redemption.reward?.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {redemption.child?.nickname} • {redemption.points_spent} points •{" "}
                                {new Date(redemption.requested_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              redemption.status === "fulfilled"
                                ? "default"
                                : redemption.status === "approved"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {redemption.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No history yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <CreateRewardSheet
        open={showCreateSheet}
        onOpenChange={setShowCreateSheet}
        householdId={user.householdId}
        userId={user.id}
      />

      {redemptionToApprove && (
        <ApproveRedemptionDialog redemption={redemptionToApprove} onClose={() => setRedemptionToApprove(null)} />
      )}
    </>
  )
}
