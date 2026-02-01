import { createClient } from "@/lib/supabase/server"

export async function getDailyUpdates(limit: number = 10, offset: number = 0, sortBy: 'recent' | 'oldest' | 'upvotes' = 'recent') {
  const supabase = await createClient()

  // Get current user for upvote check
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // For upvotes sorting, we need to fetch all updates first since we need the upvote counts
  // For date-based sorting, we can use direct database ordering
  let query = supabase
    .from("daily_updates")
    .select("*", { count: 'exact' })

  // Apply date-based ordering at database level
  if (sortBy === 'recent') {
    query = query.order("created_at", { ascending: false })
  } else if (sortBy === 'oldest') {
    query = query.order("created_at", { ascending: true })
  }
  // For upvotes, we'll fetch all and sort client-side to include upvote counts

  const { data: daily_updates, error } = await query.range(offset, offset + limit - 1)

  if (error) {
    console.error("Error fetching daily updates:", error)
    return []
  }

  if (!daily_updates || daily_updates.length === 0) {
    return []
  }

  // Get unique user IDs and college IDs
  const userIds = [...new Set(daily_updates.map(u => u.user_id).filter(Boolean))]
  const collegeIds = [...new Set(daily_updates.map(u => u.college_id).filter(Boolean))]
  const updateIds = daily_updates.map(u => u.id)

  // Fetch profiles for all user IDs
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds)

  // Fetch colleges for all college IDs
  const { data: colleges, error: collegeError } = await supabase
    .from("colleges")
    .select("id, name")
    .in("id", collegeIds)

  // Fetch user's upvotes if logged in
  let userUpvotes: Set<string> = new Set()
  if (user) {
    const { data: upvotes, error: upvotesError } = await supabase
      .from("daily_update_upvotes")
      .select("update_id")
      .eq("user_id", user.id)
      .in("update_id", updateIds)

    if (!upvotesError && upvotes) {
      userUpvotes = new Set(upvotes.map(u => u.update_id))
    }
  }

  if (profileError) {
    console.error("Error fetching profiles:", profileError)
  }

  if (collegeError) {
    console.error("Error fetching colleges:", collegeError)
  }

  // Create maps for quick lookup
  const profileMap = (profiles || []).reduce((acc, profile) => {
    acc[profile.id] = profile.full_name
    return acc
  }, {} as Record<string, string>)

  const collegeMap = (colleges || []).reduce((acc, college) => {
    acc[college.id] = college.name
    return acc
  }, {} as Record<string, string>)

  // Combine data
  return daily_updates.map(update => {
    const mappedUpdate = {
      ...update,
      user_name: update.user_id ? profileMap[update.user_id] : null,
      college_name: update.college_id ? collegeMap[update.college_id] : null,
      hasUpvoted: userUpvotes.has(update.id),
      upvote_count: update.upvote_count ?? 0
    }
    return mappedUpdate
  })
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

