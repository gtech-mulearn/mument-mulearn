'use server'

import { createClient } from "@/lib/supabase/server"
import { searchDailyUpdates } from "@/lib/daily-updates"

export async function fetchDailyUpdates() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("Not authenticated")
    }

    const { data, error } = await supabase
      .from("daily_updates")
      .select("id, user_id, content, created_at, college_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200)

    if (error) throw error

    return data || []
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch updates"
    throw new Error(message)
  }
}

export async function searchUpdates(
  keyword: string = "",
  college: string = "",
  date: string = "",
  sort: 'recent' | 'oldest' | 'upvotes' = 'recent',
  page: number = 1,
  limit: number = 50
) {
  return await searchDailyUpdates(keyword, college, date, sort, page, limit)
}

export async function upvoteUpdate(updateId: string, action: 'upvote' | 'remove') {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  if (action === 'upvote') {
    const { data, error } = await supabase
      .from("daily_update_upvotes")
      .insert({ user_id: user.id, update_id: updateId })
      .select("id")
      .single()

    if (error) {
      if (error.code === "23505") {
        return { success: false, message: "Already upvoted" }
      }
      throw error
    }

    const { data: updateData, error: updateError } = await supabase
      .from("daily_updates")
      .select("upvote_count")
      .eq("id", updateId)
      .single()

    if (updateError) throw updateError

    return { success: true, data: { new_count: updateData?.upvote_count || 0 } }
  } else {
    const { error: deleteError } = await supabase
      .from("daily_update_upvotes")
      .delete()
      .eq("user_id", user.id)
      .eq("update_id", updateId)

    if (deleteError) throw deleteError

    const { data: updateData, error: updateError } = await supabase
      .from("daily_updates")
      .select("upvote_count")
      .eq("id", updateId)
      .single()

    if (updateError) throw updateError

    return { success: true, data: { new_count: updateData?.upvote_count || 0 } }
  }
}

export async function postDailyUpdate(content: string, startISO?: string, endISO?: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("Not authenticated")
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("campus_id")
      .eq("id", user.id)
      .single()

    if (profileError) throw profileError

    const collegeId = profile?.campus_id || null

    // Check if already submitted today
    const query = supabase.from("daily_updates").select("id").eq("user_id", user.id).limit(1)
    if (startISO && endISO) {
      query.gte("created_at", startISO).lt("created_at", endISO)
    } else {
      const now = new Date()
      const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0))
      const sISO = startOfDay.toISOString()
      const eISO = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000).toISOString()
      query.gte("created_at", sISO).lt("created_at", eISO)
    }

    const { data: existing, error: fetchErr } = await query

    if (fetchErr) throw fetchErr
    if (existing && existing.length > 0) {
      throw new Error("You have already submitted an update today")
    }

    const { error } = await supabase.from("daily_updates").insert({
      user_id: user.id,
      content,
      college_id: collegeId,
    })

    if (error) throw error

    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to post update"
    return { error: message }
  }
}
