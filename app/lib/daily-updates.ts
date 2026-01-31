import { createClient } from "@/lib/supabase/server"

export async function getDailyUpdates() {
  const supabase = await createClient()

  const { data: daily_updates, error } = await supabase
    .from("daily_updates")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching daily updates:", error)
    return []
  }

  if (!daily_updates || daily_updates.length === 0) {
    return []
  }

  // Get unique user IDs
  const userIds = [...new Set(daily_updates.map(u => u.user_id).filter(Boolean))]

  // Fetch profiles for all user IDs
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds)

  if (profileError) {
    console.error("Error fetching profiles:", profileError)
    return daily_updates
  }

  // Create a map for quick lookup
  const profileMap = (profiles || []).reduce((acc, profile) => {
    acc[profile.id] = profile.full_name
    return acc
  }, {} as Record<string, string>)

  // Combine data
  return daily_updates.map(update => ({
    ...update,
    user_name: update.user_id ? profileMap[update.user_id] : null
  }))
}
