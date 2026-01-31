import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const updateId = params.id

    const { data, error } = await supabase
      .from("daily_updates")
      .select("upvote_count")
      .eq("id", updateId)
      .single()

    if (error) {
      console.error("Error fetching upvote count:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ upvote_count: data?.upvote_count ?? 0 })
  } catch (error) {
    console.error("Error in count endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
