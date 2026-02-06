import { createClient } from "@/lib/supabase/server"
import { getMyProfile } from "@/lib/profile"

/**
 * Get buddy record for current user
 * 1. Get user profile (has user.role)
 * 2. Check if user.role === "buddy"
 * 3. If buddy, fetch buddy record from buddies table using user_id
 * 4. Return buddy.id
 */
export async function getBuddyRecord() {
    const supabase = await createClient()
    const user = await getMyProfile()

    if (!user) {
        console.error("[getBuddyRecord] User not found")
        return null
    }

    // Only buddies have a record in buddies table
    if (user.role !== "buddy") {
        console.warn("[getBuddyRecord] User is not a buddy, role:", user.role)
        return null
    }

    // Fetch buddy record from buddies table using user_id
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
