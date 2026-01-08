// Haptic feedback utility with patterns, throttling, and graceful fallback

type HapticPattern = "TAP" | "SUCCESS" | "DOUBLE_SUCCESS" | "CELEBRATION"

// Pattern definitions (in milliseconds)
const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  TAP: 10,
  SUCCESS: 20,
  DOUBLE_SUCCESS: [15, 40, 15],
  CELEBRATION: [20, 50, 20, 50, 20],
}

// Throttling map to prevent spam
const lastHapticTime = new Map<HapticPattern, number>()
const THROTTLE_MS = 100 // Don't allow same pattern more than once per 100ms

/**
 * Trigger haptic feedback with throttling and graceful fallback
 * @param pattern - The haptic pattern to play
 */
export function haptic(pattern: HapticPattern): void {
  // Check if Vibration API is supported
  if (!("vibrate" in navigator)) {
    return
  }

  // Throttle to prevent spam
  const now = Date.now()
  const lastTime = lastHapticTime.get(pattern) || 0

  if (now - lastTime < THROTTLE_MS) {
    return
  }

  try {
    const vibrationPattern = HAPTIC_PATTERNS[pattern]
    const success = navigator.vibrate(vibrationPattern)

    if (success) {
      lastHapticTime.set(pattern, now)
    }
  } catch (error) {
    // Silently fail if vibration is not supported or blocked
    // Do not log in production
  }
}

/**
 * Check if haptics are supported
 */
export function isHapticSupported(): boolean {
  return "vibrate" in navigator
}

// Convenience object for common haptic patterns
export const haptics = {
  tap: () => haptic("TAP"),
  success: () => haptic("SUCCESS"),
  doubleSuccess: () => haptic("DOUBLE_SUCCESS"),
  celebration: () => haptic("CELEBRATION"),
}
