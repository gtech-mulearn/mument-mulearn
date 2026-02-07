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

    // If user is a buddy, fetch their buddy ID
    let buddyId: string | null = null
    buddyId = await getBuddyId()
    if (user.role === "buddy") {
        if (!buddyId) {
            console.warn("[getCheckpoints] Buddy record not found for user:", user.id)
            return []
        }
    }

    // Single efficient query with joins to teams, buddies, and profiles
    let query = supabase
        .from("checkpoints")
        .select(`
            *,
            teams:team_id (id, team_name),
            buddies:buddy_id (
                id,
                profiles:user_id (id, full_name)
            )
        `)

    // Filter by buddy_id if user is a buddy
    if (user.role === "buddy" && buddyId) {
        query = query.eq("buddy_id", buddyId)
    }
    // Filter by campus_id if user is a campus coordinator
    if (user.role === "campus_coordinator" && user.campus_id) {
        query = query.eq("campus_id", user.campus_id)
    }
    // Admins can see all checkpoints
    // Non-buddy/non-coordinator participants don't see checkpoints

    const { data, error } = await query.order("created_at", { ascending: false }).limit(50)

    if (error) {
        console.error("[getCheckpoints] Error fetching checkpoints:", error)
        return []
    }

    console.log("[getCheckpoints] Raw data:", JSON.stringify(data, null, 2))

    // Handle the joined data
    const checkpoints = data?.map(checkpoint => {
        const teamData = Array.isArray(checkpoint.teams) ? checkpoint.teams[0] : checkpoint.teams
        const buddyData = Array.isArray(checkpoint.buddies) ? checkpoint.buddies[0] : checkpoint.buddies
        const profileData = buddyData?.profiles
        
        const mapped = {
            ...checkpoint,
            team_name: teamData?.team_name || "Unknown Team",
            buddy_name: profileData?.full_name || "Unknown Buddy"
        }
        
        console.log("[getCheckpoints] Mapped checkpoint:", {
            id: mapped.id,
            team_name: mapped.team_name,
            buddy_name: mapped.buddy_name,
            checkpoint_number: mapped.checkpoint_number,
            is_absent: mapped.is_absent
        })
        
        return mapped
    }) || []

    console.log("[getCheckpoints] Total checkpoints returned:", checkpoints.length)

    return checkpoints as any[]
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

export async function getBuddyVerifiableTeams(userId: string) {
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

    // Get all teams in buddy's campus
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

    // Fetch teams where buddy is a member
    const { data: memberTeams, error: memberError } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)

    if (memberError) {
        console.error("Error fetching buddy's member teams:", memberError)
        return []
    }

    const memberTeamIds = (memberTeams || []).map((m: { team_id: string }) => m.team_id)

    // Fetch teams assigned to this buddy from buddy_teams
    const buddyId = await getBuddyId()
    if (!buddyId) {
        console.warn("Buddy record not found for user:", user.id)
        return []
    }
    const { data: assignedTeams, error: assignedError } = await supabase
        .from("buddy_teams")
        .select("team_id")
        .eq("buddy_id", buddyId)

    if (assignedError) {
        console.error("Error fetching buddy's assigned teams:", assignedError)
        return []
    }

    console.log("Teams assigned to buddy from buddy_teams:", assignedTeams)

    const assignedTeamIds = (assignedTeams || []).map((a: { team_id: string }) => a.team_id)
    console.log("[getBuddyVerifiableTeams] Buddy is assigned to team IDs:", assignedTeamIds)

    // Filter out teams assigned to buddy and teams buddy is a member of
    const verifiableTeams = campusTeams.filter((team: { id: string; team_name: string }) => {
        // Exclude if assigned to this buddy
        if (assignedTeamIds.includes(team.id)) {
            console.log(`[getBuddyVerifiableTeams] Excluding team assigned to buddy: ${team.team_name} (${team.id})`)
            return false;
        }
        // Exclude if buddy is a member
        if (memberTeamIds.includes(team.id)) {
            console.log(`[getBuddyVerifiableTeams] Excluding team where buddy is member: ${team.team_name} (${team.id})`)
            return false;
        }
        return true;
    })

    console.log("[getBuddyVerifiableTeams] Verifiable teams:", verifiableTeams.map(t => ({ id: t.id, team_name: t.team_name })))

    return verifiableTeams
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

    // Fetch the buddy ID using role-based helper
    const buddyId = await getBuddyId()
    if (!buddyId) {
        throw new Error("Buddy record not found. Please contact admin.")
    }

    // Guard: Ensure team_id is present
    if (!data.team_id) {
        throw new Error("Team ID is required for checkpoint verification.")
    }

    // Verify that the buddy is not a member of the selected team
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

    // Verify that the team is in the buddy's campus
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
        buddy_id: buddyId,
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
