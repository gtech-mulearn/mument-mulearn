'use server'

import { getAnnouncements } from "@/lib/announcements"

export async function fetchAnnouncements() {
  try {
    const announcements = await getAnnouncements()
    return { announcements }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch announcements"
    return { error: message, announcements: [] }
  }
}
