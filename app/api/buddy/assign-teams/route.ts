import { createClient } from "@/lib/supabase/server"
import { getMyProfile } from "@/lib/profile"
import { getBuddyId } from "@/lib/roles"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const user = await getMyProfile()

        // Get buddy ID first
        const buddyId = await getBuddyId()
        
        // Verify user is a buddy (has buddy ID)
        if (!user || !buddyId) {
            return NextResponse.json(
                { error: "Unauthorized. Only buddies can assign teams." },
                { status: 403 }
            )
        }

        // Parse request body
        const { teamIds } = await request.json()

        if (!Array.isArray(teamIds)) {
            return NextResponse.json(
                { error: "teamIds must be an array" },
                { status: 400 }
            )
        }

        // Verify all teams exist in buddy's campus and are not assigned to other buddies
        const { data: teams, error: teamsError } = await supabase
            .from("teams")
            .select("id, campus_id")
            .in("id", teamIds)

        if (teamsError) {
            throw teamsError
        }

        if (!teams || teams.length !== teamIds.length) {
            return NextResponse.json(
                { error: "One or more teams not found" },
                { status: 404 }
            )
        }

        // Verify all teams are in buddy's campus
        if (!teams.every(team => team.campus_id === user.campus_id)) {
            return NextResponse.json(
                { error: "All teams must be in your campus" },
                { status: 400 }
            )
        }

        // Check if any team is assigned to another buddy
        const { data: otherAssignments, error: checkError } = await supabase
            .from("buddy_teams")
            .select("team_id")
            .in("team_id", teamIds)
            .neq("buddy_id", buddyId)

        if (checkError) {
            throw checkError
        }

        if (otherAssignments && otherAssignments.length > 0) {
            return NextResponse.json(
                { error: "One or more teams are already assigned to another buddy" },
                { status: 409 }
            )
        }

        // Delete existing buddy_teams assignments for this buddy
        const { error: deleteError } = await supabase
            .from("buddy_teams")
            .delete()
            .eq("buddy_id", buddyId)

        if (deleteError) {
            throw deleteError
        }

        // If teamIds is empty, we're done (buddy unassigned all teams)
        if (teamIds.length === 0) {
            return NextResponse.json({
                message: "All team assignments removed",
                assignedCount: 0
            })
        }

        // Insert new assignments
        const assignments = teamIds.map(teamId => ({
            buddy_id: buddyId,
            team_id: teamId
        }))

        const { error: insertError } = await supabase
            .from("buddy_teams")
            .insert(assignments)

        if (insertError) {
            throw insertError
        }

        return NextResponse.json({
            message: "Team assignments saved successfully",
            assignedCount: teamIds.length
        })
    } catch (error) {
        console.error("[POST /api/buddy/assign-teams] Error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
