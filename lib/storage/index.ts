// Vercel Blob storage wrapper

export async function uploadAvatar(file: File, userId: string): Promise<string | null> {
  try {
    // TODO: Integrate with Vercel Blob
    // For MVP, return placeholder

    // In production:
    // const { put } = await import('@vercel/blob')
    // const blob = await put(`avatars/${userId}/${file.name}`, file, {
    //   access: 'public',
    // })
    // return blob.url

    return `/placeholder.svg?height=100&width=100&query=avatar`
  } catch (error) {
    console.error("[v0] Avatar upload error:", error)
    return null
  }
}

export async function uploadBadgeIcon(file: File, badgeKey: string): Promise<string | null> {
  try {
    // TODO: Integrate with Vercel Blob
    return `/placeholder.svg?height=64&width=64&query=badge`
  } catch (error) {
    console.error("[v0] Badge upload error:", error)
    return null
  }
}

export function getAvatarUrl(userId: string): string {
  // Return placeholder for MVP
  return `/placeholder.svg?height=100&width=100&query=avatar+${userId}`
}

export function getBadgeIconUrl(badgeKey: string): string {
  return `/placeholder.svg?height=64&width=64&query=badge+${badgeKey}`
}
