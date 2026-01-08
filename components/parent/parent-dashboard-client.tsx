"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Calendar, CheckCircle2, Users, TrendingUp, Sparkles, Gift, Copy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { motion } from "framer-motion"
import { haptic } from "@/lib/haptics"
import { fadeIn, staggerIn } from "@/lib/motion"

interface ParentDashboardClientProps {
  user: any
  stats: any
  children: any[]
  weeklySummary: any
  weeklyTasks: any[]
}

export function ParentDashboardClient({
  user,
  stats,
  children,
  weeklySummary,
  weeklyTasks,
}: ParentDashboardClientProps) {
  const [copiedPraise, setCopiedPraise] = useState(false)

  // Process weekly data for chart
  const questsByDay = weeklyTasks.reduce(
    (acc, task) => {
      const day = new Date(task.approved_at).toLocaleDateString("en-US", { weekday: "short" })
      acc[day] = (acc[day] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const questsByCategory = weeklyTasks.reduce(
    (acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const copyPraiseLine = (line: string) => {
    navigator.clipboard.writeText(line)
    setCopiedPraise(true)
    haptic("SUCCESS")
    setTimeout(() => setCopiedPraise(false), 2000)
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
              <Button variant="ghost" className="underline">
                Dashboard
              </Button>
            </Link>
            <Link href="/parent/quests">
              <Button variant="ghost">Quests</Button>
            </Link>
            <Link href="/parent/rewards">
              <Button variant="ghost">Rewards</Button>
            </Link>
            <Link href="/parent/social">
              <Button variant="ghost">Social</Button>
            </Link>
            <Link href="/parent/settings">
              <Button variant="ghost">Settings</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto flex-1 p-6 max-w-7xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">Your household's progress and insights</p>
        </div>

        <Tabs defaultValue="this-week" className="mb-8">
          <TabsList>
            <TabsTrigger value="this-week">This Week</TabsTrigger>
            <TabsTrigger value="last-week">Last Week</TabsTrigger>
          </TabsList>

          <TabsContent value="this-week" className="space-y-6">
            {/* KPI Cards */}
            <motion.div
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
              variants={staggerIn}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={fadeIn}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Children</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total_children}</div>
                    <p className="text-xs text-muted-foreground">Active members</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeIn}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.pending_approvals}</div>
                    <p className="text-xs text-muted-foreground">Awaiting review</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeIn}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Quests Completed</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.weekly_completions}</div>
                    <p className="text-xs text-muted-foreground">This week</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeIn}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Streaks</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.active_streaks}</div>
                    <p className="text-xs text-muted-foreground">Currently active</p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            <motion.div
              className="grid gap-6 md:grid-cols-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Quests by Day */}
              <Card>
                <CardHeader>
                  <CardTitle>Quests Completed by Day</CardTitle>
                  <CardDescription>Daily completion trend</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(questsByDay).map(([day, count]) => (
                      <div key={day} className="flex items-center gap-4">
                        <div className="w-16 text-sm font-medium">{day}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${(count / Math.max(...Object.values(questsByDay))) * 100}%` }}
                          >
                            <span className="text-xs font-bold text-white">{count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {Object.keys(questsByDay).length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No quests completed this week yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Category Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Quest Categories</CardTitle>
                  <CardDescription>Distribution by type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(questsByCategory).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{category}</Badge>
                        </div>
                        <div className="font-bold text-lg">{count}</div>
                      </div>
                    ))}
                  </div>
                  {Object.keys(questsByCategory).length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No categories yet</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
              {/* Children Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Children Overview</CardTitle>
                  <CardDescription>Individual progress and stats</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {children.map((child: any) => (
                      <div key={child.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-2xl font-bold">
                            {child.nickname.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-lg">{child.nickname}</p>
                            <p className="text-sm text-muted-foreground">
                              {child.age_band ? child.age_band.replace("_", " ") : "Age not set"}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-6 text-center">
                          <div>
                            <p className="text-2xl font-bold text-indigo-600">
                              {child.points?.[0]?.available_points || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">Points</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-orange-600">
                              {child.streak?.[0]?.current_streak || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">Streak</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-yellow-600">
                              {child.points?.[0]?.weekly_points || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">This Week</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {weeklySummary && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
                {/* AI Weekly Brief */}
                <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      Weekly Insights
                    </CardTitle>
                    <CardDescription>AI-generated summary and suggestions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2">Summary</h4>
                      <p className="text-sm leading-relaxed">{weeklySummary.ai_summary || "No summary available"}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Strengths
                        </h4>
                        <ul className="space-y-2">
                          {weeklySummary.strengths?.map((strength: string, i: number) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="text-green-500">✓</span>
                              <span>{strength}</span>
                            </li>
                          )) || <li className="text-sm text-muted-foreground">No strengths noted</li>}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                          Opportunities
                        </h4>
                        <ul className="space-y-2">
                          {weeklySummary.opportunities?.map((opp: string, i: number) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="text-blue-500">→</span>
                              <span>{opp}</span>
                            </li>
                          )) || <li className="text-sm text-muted-foreground">No opportunities noted</li>}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Gift className="h-4 w-4 text-purple-500" />
                        Suggested Praise Lines
                      </h4>
                      <div className="space-y-2">
                        {weeklySummary.praise_lines?.map((line: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 p-2 rounded bg-white/60 border">
                            <p className="flex-1 text-sm italic">"{line}"</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyPraiseLine(line)}
                              className="flex-shrink-0"
                            >
                              {copiedPraise ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        )) || <p className="text-sm text-muted-foreground">No praise lines suggested</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="last-week">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-12">
                  Last week's data will be available once you complete your first full week
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
