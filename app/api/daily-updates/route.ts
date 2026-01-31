import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ message: "Not authenticated" }, { status: 401 })

    const { data, error } = await supabase
      .from("daily_updates")
      .select("id, user_id, content, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message || "Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ message: "Not authenticated" }, { status: 401 })

    const body = await req.json()
    const content = (body.content || "").toString().trim()
    if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 })
    
    // Get user's college_id from profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("campus_id")
      .eq("id", user.id)
      .single()

    if (profileError) return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })

    const collegeId = profile?.campus_id || null

    // Prevent multiple submissions per user per UTC day.
    // Allow client to pass local-day UTC bounds (startISO/endISO). If provided, use them.
    const startISO = typeof body?.startISO === "string" ? body.startISO : null
    const endISO = typeof body?.endISO === "string" ? body.endISO : null

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

    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "You have already submitted an update today" }, { status: 409 })
    }

    const { data, error } = await supabase
      .from("daily_updates")
      .insert({ content, user_id: user.id, college_id: collegeId })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message || "Error" }, { status: 500 })
  }
}
