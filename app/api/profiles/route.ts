import { createClient } from "@/lib/supabase/server"

export async function GET() {
    const supabaseServer = await createClient()

    const {
        data: { user },
    } = await supabaseServer.auth.getUser()

    if (!user) {
        return new Response(JSON.stringify({ error: "Not authenticated" }), {
            status: 401,
            headers: { "content-type": "application/json" },
        })
    }

    const { data: profile, error } = await supabaseServer
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", user.id)
        .single()

    if (error) {
        return new Response(
            JSON.stringify({ error: (error as { message?: string })?.message ?? "Failed to fetch profile" }),
            { status: 500, headers: { "content-type": "application/json" } }
        )
    }

    if (!profile) {
        return new Response(JSON.stringify({ error: "Profile not found" }), {
            status: 404,
            headers: { "content-type": "application/json" },
        })
    }

    return new Response(JSON.stringify(profile), {
        status: 200,
        headers: { 
            "content-type": "application/json",
            "Cache-Control": "private, max-age=300, stale-while-revalidate=600"
        },
    })
}