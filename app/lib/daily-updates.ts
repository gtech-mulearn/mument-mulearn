import { createClient } from "@/lib/supabase/server"

export async function getDailyUpdates(limit: number = 10, offset: number = 0, sortBy: 'recent' | 'oldest' | 'upvotes' = 'recent') {
  const supabase = await createClient()

  // Get current user for upvote check
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch daily updates with joined profile and college data
  let query = supabase
    .from("daily_updates")
    .select(`
      *,
      profiles:user_id (id, full_name),
      colleges:college_id (id, name)
    `, { count: 'exact' })

  // Apply date-based ordering at database level
  if (sortBy === 'recent') {
    query = query.order("created_at", { ascending: false })
  } else if (sortBy === 'oldest') {
    query = query.order("created_at", { ascending: true })
  }

  // Apply limit and offset for pagination
  query = query.range(offset, offset + limit - 1)

  // Fetch data with specified limit and get the total count
  const { data: daily_updates, error, count: totalCount } = await query

  if (error) {
    console.error("Error fetching daily updates:", error)
    return { updates: [], totalCount: 0 }
  }

  if (!daily_updates || daily_updates.length === 0) {
    return { updates: [], totalCount: totalCount ?? 0 }
  }

  // Get update IDs for upvote check
  const updateIds = daily_updates.map(u => u.id)

  // Fetch user's upvotes if logged in
  let userUpvotes: Set<string> = new Set()
  if (user && updateIds.length > 0) {
    const { data: upvotes, error: upvotesError } = await supabase
      .from("daily_update_upvotes")
      .select("update_id")
      .eq("user_id", user.id)
      .in("update_id", updateIds)

    if (!upvotesError && upvotes) {
      userUpvotes = new Set(upvotes.map(u => u.update_id))
    }
  }

  // Map joined data
  const updates = daily_updates.map(update => {
    // Handle joined profile data (may be null or array depending on Supabase response)
    const profileData = Array.isArray(update.profiles) ? update.profiles[0] : update.profiles
    const collegeData = Array.isArray(update.colleges) ? update.colleges[0] : update.colleges

    return {
      ...update,
      user_name: profileData?.full_name || 'Anonymous',
      college_name: collegeData?.name || null,
      hasUpvoted: userUpvotes.has(update.id),
      upvote_count: update.upvote_count ?? 0
    }
  })

  return { updates, totalCount: totalCount ?? updates.length }
}

export async function getUserStreak(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("daily_updates")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error || !data) return 0

  if (data.length === 0) return 0

  const dates = data.map(d => {
    // Normalize to YYYY-MM-DD based on UTC or local? 
    // Supabase stores as timestamptz usually. 
    // Let's use simple date extraction.
    return new Date(d.created_at).toISOString().split('T')[0]
  })

  // Unique dates sorted desc
  const uniqueDates = Array.from(new Set(dates)).sort((a, b) => b.localeCompare(a))

  if (uniqueDates.length === 0) return 0

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  // If top isn't today or yesterday, streak is 0
  const last = uniqueDates[0]
  if (last !== today && last !== yesterday) return 0

  let streak = 0
  let current = new Date(last)

  for (const dateStr of uniqueDates) {
    if (dateStr === current.toISOString().split('T')[0]) {
      streak++
      // Go back one day
      current.setDate(current.getDate() - 1)
    } else {
      // Gap found
      break
    }
  }

  return streak
}

