"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Users, Trophy, TrendingUp, Copy, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { requestFriendAction } from "@/app/actions/social-actions"

interface KidFriendsClientProps {
  user: any
  friends: any[]
  leaderboard: any[]
  inviteCode?: string
}

export function KidFriendsClient({ user, friends, leaderboard, inviteCode }: KidFriendsClientProps) {
  const [friendCode, setFriendCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [copied, setCopied] = useState(false)

  const handleRequestFriend = async () => {
    if (!friendCode.trim()) return

    setIsSubmitting(true)
    setMessage("")

    const result = await requestFriendAction(user.id, friendCode.trim())

    if (result.success) {
      setMessage("Friend request sent! Waiting for parent approval.")
      setFriendCode("")
      // Haptic feedback
      if ("vibrate" in navigator) {
        navigator.vibrate(50)
      }
    } else {
      setMessage(result.error || "Could not send friend request. Check the code and try again.")
    }

    setIsSubmitting(false)
  }

  const copyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      if ("vibrate" in navigator) {
        navigator.vibrate(30)
      }
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const userRank = leaderboard.findIndex((entry) => entry.user_id === user.id) + 1

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/kid/home">
            <h1 className="text-2xl font-bold text-indigo-600">StarSprout</h1>
          </Link>
        </div>
      </header>

      <main className="container mx-auto flex-1 p-6 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Friends</h2>
          <p className="text-muted-foreground">Connect and compare progress with friends</p>
        </div>

        {/* Your Invite Code */}
        {inviteCode && (
          <Card className="mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 border-indigo-200">
            <CardHeader>
              <CardTitle className="text-lg">Your Friend Code</CardTitle>
              <CardDescription>Share this code with friends so they can add you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-2xl font-mono font-bold bg-white/60 rounded-lg px-4 py-3 text-center">
                  {inviteCode}
                </code>
                <Button onClick={copyInviteCode} size="lg" variant="secondary">
                  {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Friend */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Add a Friend</CardTitle>
            <CardDescription>Enter your friend's code to send a friend request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter friend code"
                value={friendCode}
                onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                className="text-lg font-mono"
                maxLength={8}
              />
              <Button onClick={handleRequestFriend} disabled={isSubmitting || !friendCode.trim()} size="lg">
                Add Friend
              </Button>
            </div>
            <AnimatePresence>
              {message && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={message.includes("sent") ? "text-green-600" : "text-amber-600"}
                >
                  {message}
                </motion.p>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Friends Leaderboard */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Friends Leaderboard
            </CardTitle>
            <CardDescription>This week's points</CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = entry.user_id === user.id
                  return (
                    <motion.div
                      key={entry.user_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 ${
                        isCurrentUser
                          ? "bg-gradient-to-r from-indigo-100 to-purple-100 border-indigo-300"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="text-2xl font-bold w-10 text-center">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-lg">
                          {entry.nickname}
                          {isCurrentUser && <Badge className="ml-2">You</Badge>}
                        </p>
                        <p className="text-sm text-muted-foreground">{entry.points} points this week</p>
                      </div>
                      {index < leaderboard.length - 1 && entry.rank < leaderboard[index + 1].rank && (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      )}
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">No friends yet!</p>
                <p className="text-sm text-muted-foreground">Add friends to see the leaderboard</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Friends List */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>My Friends</CardTitle>
            <CardDescription>All your approved friends</CardDescription>
          </CardHeader>
          <CardContent>
            {friends.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {friends.map((friend: any) => (
                  <div
                    key={friend.id}
                    className="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 bg-white"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full mb-3 flex items-center justify-center text-2xl">
                      {friend.nickname.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-bold text-center">{friend.nickname}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No friends yet. Add some friends to get started!</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
