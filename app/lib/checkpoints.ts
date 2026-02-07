import { createClient } from "@/lib/supabase/server"
import { permissions } from "@/lib/permissions"
import { getMyProfile } from "@/lib/profile"
import { getBuddyId } from "@/lib/roles"
import { Database } from "@/types/database.types"

export type Checkpoint = Database["public"]["Tables"]["checkpoints"]["Row"]

export async function getCheckpoints() {
    const supabase = await createClient()
    const user = await getMyProfile()

    if (!user) return []

    console.log("[getCheckpoints] Fetching checkpoints for user:", {
        userId: user.id,
        role: user.role,
        campusId: user.campus_id
    })

    try {
        // Query with join to teams table to get team_name
        let query = supabase
            .from("checkpoints")
            .select(`
                *,
                teams:team_id (
                    id,
                    team_name
                )
            `)

        // Filter based on role
        if (user.role === "buddy" || user.role === "campus_coordinator") {
            if (user.campus_id) {
                query = query.eq("campus_id", user.campus_id)
                console.log("[getCheckpoints] Applied campus filter:", user.campus_id)
            } else {
                console.warn("[getCheckpoints] Buddy/Coordinator has no campus_id")
                return []
            }
        } else if (user.role === "admin") {
            console.log("[getCheckpoints] Admin user - no campus filter")
        } else {
            console.warn("[getCheckpoints] User role not authorized:", user.role)
            return []
        }

        const { data, error, count } = await query
            .order("created_at", { ascending: false })
            .limit(50)

        if (error) {
            console.error("[getCheckpoints] Error object:", error)
            console.error("[getCheckpoints] Error keys:", Object.keys(error))
            console.error("[getCheckpoints] Error toString:", error.toString())
            console.error("[getCheckpoints] Error JSON:", JSON.stringify(error))
            throw error
        }

        console.log("[getCheckpoints] Success! Found", count || data?.length || 0, "checkpoints")

        // Return data with team info included in the teams field
        return data || []
    } catch (err) {
        console.error("[getCheckpoints] Caught error:", err)
        if (err instanceof Error) {
            console.error("[getCheckpoints] Error message:", err.message)
            console.error("[getCheckpoints] Error stack:", err.stack)
        }
        return []
    }
}

export async function getBuddyTeams(userId: string) {
    const supabase = await createClient()

    // Fetch teams where user is a member
    const { data: members, error: memberError } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", userId)

    if (memberError || !members || members.length === 0) return []

    const teamIds = members.map((m: { team_id: string }) => m.team_id)

    const { data: teams, error: teamError } = await supabase
        .from("teams")
        .select("id, team_name")
        .in("id", teamIds)

    if (teamError) return []

    return teams
}

export async function getBuddyVerifiableTeams() {
    const supabase = await createClient()
    const user = await getMyProfile()

    if (!user) {
        console.error("User not found")
        return []
    }

    if (!user.campus_id) {
        console.warn("Buddy has no campus_id assigned. Cannot show verifiable teams.")
        return []
    }

    // Get all teams in buddy's campus (no filtering - allow buddy/coordinator to assign checkpoint to any team)
    const { data: campusTeams, error: teamError } = await supabase
        .from("teams")
        .select("id, team_name")
        .eq("campus_id", user.campus_id)

    if (teamError) {
        console.error("Error fetching campus teams:", teamError)
        return []
    }

    if (!campusTeams || campusTeams.length === 0) {
        console.warn("No teams found in buddy's campus")
        return []
    }

    // Return all teams in campus - buddy and coordinator can assign checkpoint to any team
    return campusTeams
}

export async function createCheckpointVerification(data: {
    team_id: string
    checkpoint_number: number
    is_absent: boolean
    meeting_medium?: string
    camera_on?: boolean
    team_introduced?: boolean
    idea_summary?: string
    last_week_progress?: string
    next_week_target?: string
    needs_support?: boolean
    support_details?: string
    suggestions?: string
}) {
    const supabase = await createClient()
    const user = await getMyProfile()

    if (!user || !permissions.canCreateCheckpoints(user.role)) {
        throw new Error("Unauthorized")
    }

    // Debug: Log incoming data
    console.log("[createCheckpointVerification] Incoming data:", data)

    // Get the verifier ID (buddy or coordinator)
    // For buddy: use buddy ID, for coordinator: use user ID
    let verifierId: string | null = null
    
    if (user.role === "buddy") {
        verifierId = await getBuddyId()
        if (!verifierId) {
            throw new Error("Buddy record not found. Please contact admin.")
        }
    } else if (user.role === "campus_coordinator") {
        verifierId = user.id
    }

    if (!verifierId) {
        throw new Error("Unable to identify verifier. Please contact admin.")
    }

    // Guard: Ensure team_id is present
    if (!data.team_id) {
        throw new Error("Team ID is required for checkpoint verification.")
    }

    // Verify that the user is not a member of the selected team
    const { data: teamMember, error: teamMemberError } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", data.team_id)
        .eq("user_id", user.id)
        .maybeSingle()

    if (teamMemberError) {
        console.error("[createCheckpointVerification] Error checking team membership:", teamMemberError)
    }

    if (teamMember) {
        throw new Error("You cannot verify your own team's checkpoint")
    }

    // Verify that the team is in the user's campus
    const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("campus_id")
        .eq("id", data.team_id)
        .single()

    if (teamError) {
        console.error("[createCheckpointVerification] Error fetching team:", teamError)
        throw new Error("Team not found")
    }

    if (!team || team.campus_id !== user.campus_id) {
        throw new Error("You can only verify teams in your campus")
    }

    // Check if checkpoint already exists for this team
    const { data: existingCheckpoint, error: checkpointError } = await supabase
        .from("checkpoints")
        .select("id")
        .eq("team_id", data.team_id)
        .eq("checkpoint_number", data.checkpoint_number)
        .maybeSingle()

    if (checkpointError) {
        console.error("[createCheckpointVerification] Error checking existing checkpoint:", checkpointError)
        throw new Error("Error checking existing checkpoint")
    }

    if (existingCheckpoint) {
        throw new Error("A checkpoint already exists for this team at this checkpoint number")
    }

    const payload = {
        buddy_id: verifierId,
        team_id: data.team_id,
        campus_id: team.campus_id,
        checkpoint_number: data.checkpoint_number,
        is_absent: data.is_absent,
        // When absent, all details are null. When present, all must have values
        meeting_medium: data.is_absent ? null : (data.meeting_medium || ""),
        camera_on: data.is_absent ? null : (data.camera_on ?? false),
        team_introduced: data.is_absent ? null : (data.team_introduced ?? false),
        idea_summary: data.is_absent ? null : (data.idea_summary || ""),
        last_week_progress: data.is_absent ? null : (data.last_week_progress || ""),
        next_week_target: data.is_absent ? null : (data.next_week_target || ""),
        needs_support: data.is_absent ? null : (data.needs_support ?? false),
        support_details: data.is_absent ? null : (data.support_details || "No support needed"),
        suggestions: data.is_absent ? null : (data.suggestions || "")
    }
    console.log("[createCheckpointVerification] Payload to insert:", payload)

    const { error } = await supabase.from("checkpoints").insert(payload)
    if (error) {
        console.error("[createCheckpointVerification] Database insert error:", error)
        throw new Error(error.message || "Failed to insert checkpoint")
    }

    console.log("[createCheckpointVerification] Checkpoint created successfully for team:", data.team_id)
}

export async function deleteCheckpoint(checkpointId: string) {
    const supabase = await createClient()
    const user = await getMyProfile()

    if (!user || !permissions.canEditCheckpoints(user.role)) {
        throw new Error("Unauthorized to delete checkpoints")
    }

    const { error } = await supabase.from("checkpoints").delete().eq("id", checkpointId)

    if (error) {
        console.error("[deleteCheckpoint] Database delete error:", error)
        throw new Error(error.message || "Failed to delete checkpoint")
    }

    console.log("[deleteCheckpoint] Checkpoint deleted successfully:", checkpointId)
}
