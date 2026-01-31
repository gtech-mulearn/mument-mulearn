import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { update_id, action } = await request.json()

    if (!update_id) {
      return NextResponse.json(
        { error: "update_id is required" },
        { status: 400 }
      )
    }

    if (!action || !["upvote", "remove"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'upvote' or 'remove'" },
        { status: 400 }
      )
    }

    // Call appropriate RPC function
    const rpcFunction = action === "upvote" 
      ? "increment_daily_update_upvote" 
      : "decrement_daily_update_upvote"

    const { data, error } = await supabase.rpc(rpcFunction, {
      p_update_id: update_id,
    })

    if (error) {
      console.error("RPC error:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, action, data })
  } catch (error) {
    console.error("Error in upvote:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
