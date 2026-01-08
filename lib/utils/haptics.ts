// Haptic feedback utility with graceful fallback

type HapticType = "light" | "medium" | "heavy" | "success" | "error"

export function haptic(type: HapticType = "light"): void {
  // Check if Vibration API is supported
  if (!("vibrate" in navigator)) {
    return
  }

  try {
    switch (type) {
      case "light":
        navigator.vibrate(10)
        break
      case "medium":
        navigator.vibrate(20)
        break
      case "heavy":
        navigator.vibrate(40)
        break
      case "success":
        navigator.vibrate([10, 30, 10])
        break
      case "error":
        navigator.vibrate([20, 50, 20])
        break
    }
  } catch (error) {
    // Silently fail if vibration is not supported or blocked
    console.debug("[v0] Haptic feedback not available")
  }
}
