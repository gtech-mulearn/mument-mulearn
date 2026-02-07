import { createClient } from "@/lib/supabase/server"
import { getMyProfile } from "@/lib/profile"
import { getBuddyId } from "@/lib/roles"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const supabase = await createClient()
        const user = await getMyProfile()
        const buddyId = await getBuddyId()

        // Verify user has buddy access (user is buddy or has a buddy ID)
        if (!user || !buddyId) {
            return NextResponse.json(
                { error: "Unauthorized. Only buddies can access this." },
                { status: 403 }
            )
        }

        if (!user.campus_id) {
            return NextResponse.json(
                { error: "Buddy has no campus assigned" },
                { status: 400 }
            )
        }

        // Run all queries in parallel for better performance
        const [
            { data: campusTeams, error: campusTeamsError },
            { data: otherBuddyTeams, error: otherBuddyError },
            { data: currentBuddyTeams, error: currentBuddyError },
            { data: memberTeams, error: memberError }
        ] = await Promise.all([
            // 1. Get all teams in buddy's campus
            supabase
                .from("teams")
                .select("id, team_name")
                .eq("campus_id", user.campus_id),
            
            // 2. Get teams assigned to other buddies
            supabase
                .from("buddy_teams")
                .select("team_id")
                .neq("buddy_id", buddyId),
            
            // 3. Get teams assigned to current buddy
            supabase
                .from("buddy_teams")
                .select("team_id")
                .eq("buddy_id", buddyId),
            
            // 4. Get teams where buddy is a member (exclude these)
            supabase
                .from("team_members")
                .select("team_id")
                .eq("user_id", user.id)
        ])

        if (campusTeamsError) throw campusTeamsError
        if (otherBuddyError) throw otherBuddyError
        if (currentBuddyError) throw currentBuddyError
        if (memberError) throw memberError

        if (!campusTeams || campusTeams.length === 0) {
            return NextResponse.json({ availableTeams: [] })
        }

        const otherAssignedTeamIds = (otherBuddyTeams || []).map(bt => bt.team_id)
        const currentAssignedTeamIds = (currentBuddyTeams || []).map(bt => bt.team_id)
        const memberTeamIds = (memberTeams || []).map(tm => tm.team_id)

        // Filter available teams
        const availableTeams = campusTeams
            .filter(team => {
                // Exclude teams assigned to other buddies
                if (otherAssignedTeamIds.includes(team.id)) {
                    return false
                }
                // Exclude teams where buddy is a member
                if (memberTeamIds.includes(team.id)) {
                    return false
                }
                return true
            })
            .map(team => ({
                ...team,
                assigned: currentAssignedTeamIds.includes(team.id)
            }))

        return NextResponse.json({ availableTeams })
    } catch (error) {
        console.error("[GET /api/buddy/available-teams] Error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
