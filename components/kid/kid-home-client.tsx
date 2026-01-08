"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Flame, Trophy, Sparkles } from "lucide-react"
import { QuestCard } from "./quest-card"
import { ReflectionPrompt } from "./reflection-prompt"
import { AICoachMessage } from "./ai-coach-message"
import { CompanionWorld } from "./companion-world"
import { haptic } from "@/lib/utils/haptics"
import Link from "next/link"

type Quest = any // TODO: Import proper type

interface KidHomeClientProps {
  user: any
  todayQuests: Quest[]
  stats: any
  points: any
  streak: any
  badges: any[]
}

export function KidHomeClient({ user, todayQuests, stats, points, streak, badges }: KidHomeClientProps) {
  const [showReflection, setShowReflection] = useState(false)
  const [currentQuestForReflection, setCurrentQuestForReflection] = useState<Quest | null>(null)
  const [showCoachMessage, setShowCoachMessage] = useState(false)
  const [coachMessage, setCoachMessage] = useState("")
  const [justCompletedQuest, setJustCompletedQuest] = useState(false)

  const pendingQuests = todayQuests.filter((q) => q.status === "pending")
  const submittedQuests = todayQuests.filter((q) => q.status === "submitted")
  const completedQuests = todayQuests.filter((q) => q.status === "approved")

  const totalToday = todayQuests.length
  const progressPercent = totalToday > 0 ? (completedQuests.length / totalToday) * 100 : 0

  const currentStreak = streak?.current_streak || 0
  const availablePoints = points?.available_points || 0

  const handleQuestSubmitted = (quest: Quest) => {
    setCurrentQuestForReflection(quest)
    setShowReflection(true)
    setJustCompletedQuest(true)
    haptic("light")
  }

  const handleReflectionComplete = async () => {
    setShowReflection(false)
    setJustCompletedQuest(false)

    // Show AI motivation message after reflection
    const message = await fetch("/api/ai/motivation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questTitle: currentQuestForReflection?.title,
        childNickname: user.nickname,
        ageBand: user.ageBand,
      }),
    }).then((r) => r.json())

    setCoachMessage(message.text)
    setShowCoachMessage(true)
    haptic("medium")

    setTimeout(() => {
      setShowCoachMessage(false)
    }, 5000)
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              StarSprout
            </h1>
            <p className="text-sm text-muted-foreground">Hey, {user.nickname}! ✨</p>
          </div>
          <nav className="flex gap-2">
            <Link href="/kid/home">
              <Button variant="ghost" size="sm" className="font-semibold">
                Home
              </Button>
            </Link>
            <Link href="/kid/rewards">
              <Button variant="ghost" size="sm">
                🎁 Rewards
              </Button>
            </Link>
            <Link href="/kid/friends">
              <Button variant="ghost" size="sm">
                👥 Friends
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto flex-1 p-4 pb-24 max-w-4xl">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-yellow-100 to-yellow-200 border-2 border-yellow-300">
              <CardContent className="pt-4 pb-4 text-center">
                <Star className="h-8 w-8 text-yellow-600 mx-auto mb-1" />
                <p className="text-3xl font-black text-yellow-900">{availablePoints}</p>
                <p className="text-xs font-medium text-yellow-800">Points</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-orange-100 to-orange-200 border-2 border-orange-300">
              <CardContent className="pt-4 pb-4 text-center">
                <Flame className="h-8 w-8 text-orange-600 mx-auto mb-1" />
                <p className="text-3xl font-black text-orange-900">{currentStreak}</p>
                <p className="text-xs font-medium text-orange-800">Day Streak</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-purple-100 to-purple-200 border-2 border-purple-300">
              <CardContent className="pt-4 pb-4 text-center">
                <Trophy className="h-8 w-8 text-purple-600 mx-auto mb-1" />
                <p className="text-3xl font-black text-purple-900">{badges.length}</p>
                <p className="text-xs font-medium text-purple-800">Badges</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <CompanionWorld streak={currentStreak} completionRate={progressPercent} />

        <AnimatePresence>
          {showCoachMessage && <AICoachMessage message={coachMessage} onDismiss={() => setShowCoachMessage(false)} />}
        </AnimatePresence>

        {totalToday > 0 && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-6">
            <Card className="bg-white/90 backdrop-blur-sm border-2 border-indigo-200">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-200"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - progressPercent / 100)}`}
                        className="text-indigo-500 transition-all duration-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-black text-indigo-600">{Math.round(progressPercent)}%</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">Today's Quests</h3>
                    <p className="text-sm text-muted-foreground">
                      {completedQuests.length} of {totalToday} complete
                    </p>
                  </div>
                  {completedQuests.length === totalToday && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <Sparkles className="h-12 w-12 text-yellow-500" />
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="space-y-4">
          {pendingQuests.length === 0 && submittedQuests.length === 0 && completedQuests.length === 0 && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-16"
            >
              <div className="text-6xl mb-4">🌟</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">All done for today!</h3>
              <p className="text-lg text-muted-foreground">Check back later for more quests</p>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {pendingQuests.map((quest, index) => (
              <motion.div
                key={quest.id}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 50, opacity: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <QuestCard quest={quest} onSubmit={handleQuestSubmitted} />
              </motion.div>
            ))}

            {submittedQuests.map((quest) => (
              <motion.div key={quest.id} initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="opacity-75">
                <Card className="border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-yellow-50">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{quest.icon_emoji || "📝"}</span>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold">{quest.title}</h3>
                        <p className="text-sm text-orange-700 font-medium mt-1">⏳ Waiting for parent to check</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {completedQuests.map((quest) => (
              <motion.div key={quest.id} initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="opacity-60">
                <Card className="border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{quest.icon_emoji || "✅"}</span>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold line-through">{quest.title}</h3>
                        <p className="text-sm text-green-700 font-medium mt-1">✓ Done! +{quest.points} points</p>
                      </div>
                      <div className="text-4xl">🎉</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {badges.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Trophy className="h-5 w-5" /> Latest Badges
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {badges.map((badge: any, index: number) => (
                <motion.div
                  key={badge.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1, type: "spring" }}
                  className="flex-shrink-0"
                >
                  <Card className="w-24 bg-gradient-to-br from-yellow-100 to-yellow-200 border-2 border-yellow-300">
                    <CardContent className="p-3 text-center">
                      <div className="text-4xl mb-1">🏆</div>
                      <p className="text-xs font-bold text-yellow-900">{badge.title}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {showReflection && currentQuestForReflection && (
          <ReflectionPrompt
            quest={currentQuestForReflection}
            childNickname={user.nickname}
            ageBand={user.ageBand}
            onComplete={handleReflectionComplete}
            onSkip={() => {
              setShowReflection(false)
              setJustCompletedQuest(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
