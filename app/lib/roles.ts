import { createClient } from "@/lib/supabase/server"
import { getMyProfile } from "@/lib/profile"

/**
 * Get buddy record for current user
 * Fetch buddy record from buddies table using user_id
 * Works for any user role that has a buddy record
 */
export async function getBuddyRecord() {
    const supabase = await createClient()
    const user = await getMyProfile()

    if (!user) {
        console.error("[getBuddyRecord] User not found")
        return null
    }

    // Fetch buddy record from buddies table using user_id
    // This works regardless of user role - checks if buddy record exists
    const { data: buddyRecord, error } = await supabase
        .from("buddies")
        .select("id")
        .eq("user_id", user.id)
        .single()

    if (error) {
        console.error("[getBuddyRecord] Error fetching buddy record:", error)
        return null
    }

    if (!buddyRecord) {
        console.warn("[getBuddyRecord] Buddy record not found for user:", user.id)
        return null
    }

    return buddyRecord
}

/**
 * Get buddy ID for current user
 * Shortcut to get only the buddy.id
 */
export async function getBuddyId(): Promise<string | null> {
    const buddyRecord = await getBuddyRecord()
    return buddyRecord?.id || null
}
