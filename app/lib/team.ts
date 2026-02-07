import { createClient } from "@/lib/supabase/server"

export type Team = {
    id: string
    team_code: string
    team_name: string
    campus_id: string
    created_at: string | null
    // Optional joined fields
    campus_name?: string
    member_count?: number
}

export type TeamFilters = {
    campus_id?: string
    search?: string
}

export async function getTeams(filters: TeamFilters = {}, limit = 100, offset = 0) {
    const supabase = await createClient()

    let query = supabase.from("teams").select(`
        id, team_code, team_name, campus_id, created_at,
        colleges:campus_id ( name )
    `, { count: "estimated" })

    if (filters.campus_id) {
        query = query.eq("campus_id", filters.campus_id)
    }

    if (filters.search) {
        query = query.or(`team_code.ilike.%${filters.search}%,team_name.ilike.%${filters.search}%`)
    }


    interface TeamRow {
        id: string
        team_code: string
        team_name: string
        campus_id: string
        created_at: string | null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        colleges?: { name: string } | Record<string, any>
    }

    const { data, count, error } = await query
        .order("team_name")
        .range(offset, offset + limit - 1)

    if (error) {
        console.error("[getTeams] Error:", error)
        return { teams: [], total: 0 }
    }

    // Transform data to match Team type
    const teams = (data || []).map((t: TeamRow) => ({
        ...t,
        campus_name: t.colleges?.name
    })) as Team[]

    return { teams, total: count || 0 }
}

export async function getTeamById(teamId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("teams")
        .select(`
            id, team_code, team_name, campus_id, created_at,
            colleges:campus_id ( name )
        `)
        .eq("id", teamId)

    if (error) {
        console.error("[getTeamById] Error:", error)
        return null
    }

    if (!data || data.length === 0) {
        return null
    }

    interface TeamDataRow {
        id: string
        team_code: string
        team_name: string
        campus_id: string
        created_at: string | null
        colleges?: { name: string }
    }

    const teamData = data[0] as unknown as TeamDataRow
    return {
        ...teamData,
        campus_name: teamData.colleges?.name
    } as Team
}

export async function createTeam(data: {
    team_code: string
    team_name: string
    campus_id: string
}) {
    const supabase = await createClient()

    const { data: result, error } = await supabase
        .from("teams")
        .insert(data)
        .select()

    if (error) {
        console.error("[createTeam] Error:", error)
        throw new Error(error.message || "Failed to create team")
    }

    if (!result || result.length === 0) {
        throw new Error("Team creation returned no data")
    }

    return result[0] as Team
}

export async function updateTeam(teamId: string, data: {
    team_code?: string
    team_name?: string
    campus_id?: string
}) {
    const supabase = await createClient()

    const { data: result, error } = await supabase
        .from("teams")
        .update(data)
        .eq("id", teamId)
        .select()

    if (error) {
        console.error("[updateTeam] Error:", error)
        throw new Error(error.message || "Failed to update team")
    }

    if (!result || result.length === 0) {
        throw new Error("Team update returned no data")
    }

    return result[0] as Team
}

export async function deleteTeam(teamId: string) {
    const supabase = await createClient()

    // Check if team has members
    const { data: members, error: memberError } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", teamId)
        .limit(1)

    if (memberError) {
        console.error("[deleteTeam] Error checking members:", memberError)
        throw new Error("Failed to check team members")
    }

    if (members && members.length > 0) {
        throw new Error("Cannot delete team: it has members. Please remove all members first.")
    }

    // Check if team has checkpoints
    const { data: checkpoints, error: checkpointError } = await supabase
        .from("checkpoints")
        .select("id")
        .eq("team_id", teamId)
        .limit(1)

    if (checkpointError) {
        console.error("[deleteTeam] Error checking checkpoints:", checkpointError)
        throw new Error("Failed to check team checkpoints")
    }

    if (checkpoints && checkpoints.length > 0) {
        throw new Error("Cannot delete team: it has checkpoint records. Archive the team instead.")
    }

    const { error } = await supabase
        .from("teams")
        .delete()
        .eq("id", teamId)

    if (error) {
        console.error("[deleteTeam] Error:", error)
        throw new Error(error.message || "Failed to delete team")
    }
}

export async function getTeamMembers(teamId: string) {
    const supabase = await createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error }: any = await supabase
        .from("team_members")
        .select(`
            id,
            user_id,
            created_at,
            profiles:user_id ( full_name, email, role )
        `)
        .eq("team_id", teamId)
        .order("created_at", { ascending: false })

    if (error) {
        console.error("[getTeamMembers] Error:", error)
        return []
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        full_name: m.profiles?.full_name,
        email: m.profiles?.email,
        role: m.profiles?.role,
        created_at: m.created_at
    }))
}

export async function removeTeamMember(teamMemberId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", teamMemberId)

    if (error) {
        console.error("[removeTeamMember] Error:", error)
        throw new Error(error.message || "Failed to remove team member")
    }
}
