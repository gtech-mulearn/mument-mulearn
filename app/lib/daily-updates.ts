import { createClient } from "@/lib/supabase/server"

export async function getDailyUpdates() {
  const supabase = await createClient()

  // Get current user for upvote check
  const {
    data: { user },
  } = await supabase.auth.getUser()

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

