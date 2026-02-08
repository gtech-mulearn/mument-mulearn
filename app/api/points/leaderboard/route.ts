import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getLeaderboard } from "@/lib/points"

export async function GET() {
  const supabase = await createClient()

  try {
    const rows = await getLeaderboard(50)

    // fetch basic profile info for listed users
    const userIds = (rows || []).map((r: any) => r.user_id)
    let profiles: Array<{ id: string; full_name?: string | null }> = []
    if (userIds.length > 0) {
      const { data } = await supabase.from("profiles").select("id, full_name").in("id", userIds)
      profiles = data || []
    }

    const list = (rows || []).map((r: any) => ({
      user_id: r.user_id,
      points: Number(r.points || 0),
      full_name: (profiles.find((p: any) => p.id === r.user_id)?.full_name) || null,
    }))

    const response = NextResponse.json({ leaderboard: list })
    // Cache for 5 minutes (300 seconds) - leaderboard updates less frequently
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
    return response
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 })
  }
}
