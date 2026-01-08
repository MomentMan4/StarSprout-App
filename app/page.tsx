"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { motion } from "framer-motion"
import { Sparkles, Shield, Heart, Star, Zap, Trophy } from "lucide-react"
import { useEffect } from "react"

export default function LandingPage() {
  useEffect(() => {
    console.log("[v0] Landing page mounted successfully")
    console.log("[v0] Current pathname:", window.location.pathname)
    console.log("[v0] Environment:", {
      clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "Set" : "Not set",
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "Not set",
    })
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 text-yellow-400"
            animate={{
              y: [0, -20, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <Sparkles className="w-8 h-8 sm:w-12 sm:h-12" />
          </motion.div>
          <motion.div
            className="absolute top-40 right-20 text-purple-400"
            animate={{
              y: [0, 20, 0],
              rotate: [0, -360],
            }}
            transition={{
              duration: 5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <Star className="w-6 h-6 sm:w-10 sm:h-10" />
          </motion.div>
          <motion.div
            className="absolute bottom-40 left-1/4 text-blue-400"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 6,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <Trophy className="w-7 h-7 sm:w-10 sm:h-10" />
          </motion.div>
        </div>

        <div className="relative z-10 text-center space-y-6 sm:space-y-8 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge
              variant="secondary"
              className="px-4 py-2 text-sm sm:text-base bg-indigo-100 text-indigo-700 border-indigo-200"
            >
              <Zap className="w-4 h-4 mr-2 inline" />
              Turn Daily Tasks Into Epic Quests
            </Badge>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-3 sm:space-y-4"
          >
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-indigo-600 tracking-tight">StarSprout</h1>
            <p className="text-xl sm:text-3xl font-semibold text-gray-800 text-balance">Build Habits Through Play</p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto text-balance leading-relaxed px-4"
          >
            A trust-first quest system that transforms routine tasks into exciting adventures. Kids build consistent
            habits while parents gain actionable insights.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center px-4"
          >
            <Link href="/sign-up" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto text-base sm:text-lg px-8 py-6 bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all"
              >
                Get Started Free
              </Button>
            </Link>
            <Link href="/sign-in" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base sm:text-lg px-8 py-6 border-2 border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 bg-transparent"
              >
                Sign In
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.15,
                  delayChildren: 0.8,
                },
              },
            }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-12 sm:mt-16 px-4"
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 },
              }}
              className="p-6 sm:p-8 bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow border border-gray-100"
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full">
                  <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
                </div>
              </div>
              <h3 className="font-bold text-lg sm:text-xl mb-2 text-gray-900">For Kids</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Complete quests, earn points, unlock badges, and build great habits through exciting gameplay
              </p>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 },
              }}
              className="p-6 sm:p-8 bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow border border-gray-100"
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full">
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                </div>
              </div>
              <h3 className="font-bold text-lg sm:text-xl mb-2 text-gray-900">For Parents</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Assign tasks instantly, track progress effortlessly, and celebrate achievements together
              </p>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 },
              }}
              className="p-6 sm:p-8 bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 sm:col-span-2 lg:col-span-1"
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full">
                  <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                </div>
              </div>
              <h3 className="font-bold text-lg sm:text-xl mb-2 text-gray-900">Privacy First</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                COPPA/GDPR compliant with no tracking, household isolation, and parent-controlled features
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <footer className="py-6 sm:py-8 text-center border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center text-sm text-gray-600 px-4">
          <Link href="/legal/privacy" className="hover:text-indigo-600 transition-colors hover:underline">
            Privacy Policy
          </Link>
          <Link href="/legal/terms" className="hover:text-indigo-600 transition-colors hover:underline">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  )
}
