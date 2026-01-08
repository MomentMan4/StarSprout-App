// MagicBell notification wrapper
// In production, integrate with MagicBell API

export type NotificationCategory = "Quests" | "Rewards" | "Social" | "Summary"

export interface NotificationPayload {
  userId: string
  title: string
  content: string
  category: NotificationCategory
  actionUrl?: string
  metadata?: Record<string, any>
}

export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  // TODO: Integrate with MagicBell
  // For MVP, log notifications
  console.log("[v0] Notification:", payload)

  // In production:
  // const response = await fetch('https://api.magicbell.com/notifications', {
  //   method: 'POST',
  //   headers: {
  //     'X-MAGICBELL-API-KEY': process.env.MAGICBELL_API_KEY!,
  //     'X-MAGICBELL-API-SECRET': process.env.MAGICBELL_API_SECRET!,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     notification: {
  //       title: payload.title,
  //       content: payload.content,
  //       recipients: [{ external_id: payload.userId }],
  //       category: payload.category,
  //       action_url: payload.actionUrl,
  //       custom_attributes: payload.metadata
  //     }
  //   })
  // })

  return true
}

export async function sendBulkNotifications(payloads: NotificationPayload[]): Promise<boolean> {
  for (const payload of payloads) {
    await sendNotification(payload)
  }
  return true
}

// ============================================================================
// NOTIFICATION EVENT CATALOG
// ============================================================================

export async function notifyTaskAssigned(childUserId: string, taskId: string, taskTitle: string): Promise<boolean> {
  return sendNotification({
    userId: childUserId,
    title: "New Quest Assigned! 🎯",
    content: `You have a new quest: "${taskTitle}"`,
    category: "Quests",
    actionUrl: "/kid/home",
    metadata: { task_id: taskId },
  })
}

export async function notifyTaskSubmitted(
  parentUserId: string,
  taskId: string,
  taskTitle: string,
  childName: string,
): Promise<boolean> {
  return sendNotification({
    userId: parentUserId,
    title: "Quest Ready for Review 📝",
    content: `${childName} has submitted "${taskTitle}"`,
    category: "Quests",
    actionUrl: "/parent/quests?tab=submitted",
    metadata: { task_id: taskId },
  })
}

export async function notifyTaskApproved(
  childUserId: string,
  taskId: string,
  taskTitle: string,
  pointsEarned: number,
): Promise<boolean> {
  return sendNotification({
    userId: childUserId,
    title: "Quest Approved! ✅",
    content: `Great job on "${taskTitle}"! You earned ${pointsEarned} points!`,
    category: "Quests",
    actionUrl: "/kid/home",
    metadata: { task_id: taskId, points: pointsEarned },
  })
}

export async function notifyTaskRejected(
  childUserId: string,
  taskId: string,
  taskTitle: string,
  reason?: string,
): Promise<boolean> {
  const content = reason
    ? `"${taskTitle}" needs another try. ${reason}`
    : `"${taskTitle}" needs another try. Keep going!`

  return sendNotification({
    userId: childUserId,
    title: "Quest Needs Work 💪",
    content,
    category: "Quests",
    actionUrl: "/kid/home",
    metadata: { task_id: taskId },
  })
}

export async function notifyBadgeAwarded(
  childUserId: string,
  badgeId: string,
  badgeName: string,
  badgeEmoji: string,
): Promise<boolean> {
  return sendNotification({
    userId: childUserId,
    title: `New Badge Unlocked! ${badgeEmoji}`,
    content: `You earned the "${badgeName}" badge!`,
    category: "Quests",
    actionUrl: "/kid/profile",
    metadata: { badge_id: badgeId },
  })
}

export async function notifyRewardRequested(
  parentUserId: string,
  rewardId: string,
  rewardName: string,
  childName: string,
): Promise<boolean> {
  return sendNotification({
    userId: parentUserId,
    title: "Reward Request 🎁",
    content: `${childName} wants to redeem "${rewardName}"`,
    category: "Rewards",
    actionUrl: "/parent/rewards?tab=pending",
    metadata: { reward_id: rewardId },
  })
}

export async function notifyRewardApproved(
  childUserId: string,
  rewardId: string,
  rewardName: string,
): Promise<boolean> {
  return sendNotification({
    userId: childUserId,
    title: "Reward Approved! 🎉",
    content: `Your "${rewardName}" has been approved!`,
    category: "Rewards",
    actionUrl: "/kid/rewards",
    metadata: { reward_id: rewardId },
  })
}

export async function notifyRewardRejected(
  childUserId: string,
  rewardId: string,
  rewardName: string,
): Promise<boolean> {
  return sendNotification({
    userId: childUserId,
    title: "Reward Not Available 😔",
    content: `"${rewardName}" is not available right now`,
    category: "Rewards",
    actionUrl: "/kid/rewards",
    metadata: { reward_id: rewardId },
  })
}

export async function notifyRewardFulfilled(
  childUserId: string,
  rewardId: string,
  rewardName: string,
): Promise<boolean> {
  return sendNotification({
    userId: childUserId,
    title: "Reward Ready! 🌟",
    content: `"${rewardName}" has been fulfilled!`,
    category: "Rewards",
    actionUrl: "/kid/rewards",
    metadata: { reward_id: rewardId },
  })
}

export async function notifyFriendRequestPending(
  parentUserId: string,
  childName: string,
  requestingChildName: string,
): Promise<boolean> {
  return sendNotification({
    userId: parentUserId,
    title: "Friend Request 👋",
    content: `${requestingChildName} wants to be friends with ${childName}`,
    category: "Social",
    actionUrl: "/parent/settings?tab=social",
    metadata: {},
  })
}

export async function notifyFriendRequestApproved(childUserId: string, friendName: string): Promise<boolean> {
  return sendNotification({
    userId: childUserId,
    title: "New Friend! 🎊",
    content: `You're now friends with ${friendName}!`,
    category: "Social",
    actionUrl: "/kid/friends",
    metadata: {},
  })
}

export async function notifyWeeklySummaryReady(parentUserId: string, weekStart: string): Promise<boolean> {
  return sendNotification({
    userId: parentUserId,
    title: "Weekly Summary Ready 📊",
    content: "Your household's weekly progress report is ready",
    category: "Summary",
    actionUrl: `/parent/dashboard?week=${weekStart}`,
    metadata: { week_start: weekStart },
  })
}
