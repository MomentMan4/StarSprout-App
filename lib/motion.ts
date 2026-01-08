"use client"

// Reusable Framer Motion variants and configurations

import type { Variants, Transition } from "framer-motion"

/**
 * Card press interaction - scales down slightly on press
 */
export const cardPress: Variants = {
  rest: { scale: 1 },
  pressed: { scale: 0.98 },
}

/**
 * CTA success pulse - subtle glow and scale up for success actions
 */
export const ctaSuccessPulse: Variants = {
  rest: { scale: 1, boxShadow: "0 0 0 0 rgba(34, 197, 94, 0)" },
  pulse: {
    scale: [1, 1.02, 1],
    boxShadow: ["0 0 0 0 rgba(34, 197, 94, 0)", "0 0 20px 4px rgba(34, 197, 94, 0.4)", "0 0 0 0 rgba(34, 197, 94, 0)"],
  },
}

/**
 * Stagger in - fade + slight y offset for sequential reveals
 */
export const staggerIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

/**
 * Simple fade in - just opacity change
 */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

/**
 * Status chip morph - crossfade between states
 */
export const statusMorph: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
}

/**
 * Sheet/modal enter - slide up + fade
 */
export const sheetEnter: Variants = {
  hidden: { opacity: 0, y: 100, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 100, scale: 0.95 },
}

/**
 * Badge reveal - scale pop with sparkle effect
 */
export const badgeReveal: Variants = {
  hidden: { scale: 0, rotate: -180, opacity: 0 },
  visible: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
    },
  },
}

/**
 * List item removal - fade + collapse
 */
export const listRemoval: Variants = {
  initial: { opacity: 1, height: "auto" },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.3 },
  },
}

/**
 * Stagger container for children
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
}

/**
 * Default spring transition
 */
export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
}

/**
 * Smooth transition for most animations
 */
export const smoothTransition: Transition = {
  duration: 0.3,
  ease: "easeInOut",
}

/**
 * Fast transition for micro-interactions
 */
export const fastTransition: Transition = {
  duration: 0.15,
  ease: "easeOut",
}

/**
 * Celebration transition - bouncy and playful
 */
export const celebrationTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 10,
}
