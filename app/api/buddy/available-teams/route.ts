import { createClient } from "@/lib/supabase/server"
import { getMyProfile } from "@/lib/profile"
import { getBuddyId } from "@/lib/roles"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const supabase = await createClient()
        const user = await getMyProfile()

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            )
        }

        if (!user.campus_id) {
            return NextResponse.json(
                { error: "User has no campus assigned" },
                { status: 400 }
            )
        }

        // Check if user is a buddy
        const buddyId = await getBuddyId()
        const isBuddy = user.role === "buddy" && buddyId
        const isCoordinator = user.role === "campus_coordinator"

        // Allow buddies with buddy record or all campus coordinators
        if (!isBuddy && !isCoordinator) {
            return NextResponse.json(
                { error: "Only buddies and campus coordinators can access this" },
                { status: 403 }
            )
        }

        // Get teams in user's campus
        const { data: campusTeams, error: campusTeamsError } = await supabase
            .from("teams")
            .select("id, team_name")
            .eq("campus_id", user.campus_id)

        if (campusTeamsError) throw campusTeamsError

        if (!campusTeams || campusTeams.length === 0) {
            return NextResponse.json({ availableTeams: [] })
        }

        // Campus coordinators WITHOUT buddy record see all teams in their campus with no filtering
        if (isCoordinator && !buddyId) {
            return NextResponse.json({ 
                availableTeams: campusTeams.map(team => ({
                    ...team,
                    assigned: false
                }))
            })
        }

        // For buddies or coordinators WITH buddy record: use buddy_id filtering
        const effectiveBuddyId = buddyId || null
        if (!effectiveBuddyId) {
            return NextResponse.json(
                { error: "Buddy record not found" },
                { status: 403 }
            )
        }

        // Get teams assigned to other buddies
        const { data: otherBuddyTeams, error: otherBuddyError } = await supabase
            .from("buddy_teams")
            .select("team_id")
            .neq("buddy_id", effectiveBuddyId!)

        if (otherBuddyError) throw otherBuddyError

        // Get teams assigned to current user (buddy)
        const { data: currentBuddyTeams, error: currentBuddyError } = await supabase
            .from("buddy_teams")
            .select("team_id")
            .eq("buddy_id", effectiveBuddyId!)

        if (currentBuddyError) throw currentBuddyError

        // Get teams where user is a member (exclude these)
        const { data: memberTeams, error: memberError } = await supabase
            .from("team_members")
            .select("team_id")
            .eq("user_id", user.id)

        if (memberError) throw memberError

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
                // Exclude teams where user is a member
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
