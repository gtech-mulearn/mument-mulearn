'use server'

import { createClient } from "@/lib/supabase/server"
import { getMyProfile } from "@/lib/profile"
import { getBuddyId } from "@/lib/roles"

export async function getAvailableTeams() {
    try {
        const supabase = await createClient()
        const user = await getMyProfile()

        if (!user) {
            throw new Error("Unauthorized")
        }

        if (!user.campus_id) {
            throw new Error("User has no campus assigned")
        }

        const buddyId = await getBuddyId()
        const isBuddy = user.role === "buddy" && buddyId
        const isCoordinator = user.role === "campus_coordinator"

        if (!isBuddy && !isCoordinator) {
            throw new Error("Only buddies and campus coordinators can access this")
        }

        const { data: campusTeams, error: campusTeamsError } = await supabase
            .from("teams")
            .select("id, team_name")
            .eq("campus_id", user.campus_id)

        if (campusTeamsError) throw campusTeamsError

        if (!campusTeams || campusTeams.length === 0) {
            return { availableTeams: [] }
        }

        if (isCoordinator && !buddyId) {
            return {
                availableTeams: campusTeams.map(team => ({
                    ...team,
                    assigned: false
                }))
            }
        }

        const effectiveBuddyId = buddyId || null
        if (!effectiveBuddyId) {
            throw new Error("Buddy record not found")
        }

        const { data: otherBuddyTeams, error: otherBuddyError } = await supabase
            .from("buddy_teams")
            .select("team_id")
            .neq("buddy_id", effectiveBuddyId)

        if (otherBuddyError) throw otherBuddyError

        const { data: currentBuddyTeams, error: currentBuddyError } = await supabase
            .from("buddy_teams")
            .select("team_id")
            .eq("buddy_id", effectiveBuddyId)

        if (currentBuddyError) throw currentBuddyError

        const { data: memberTeams, error: memberError } = await supabase
            .from("team_members")
            .select("team_id")
            .eq("user_id", user.id)

        if (memberError) throw memberError

        const otherAssignedTeamIds = (otherBuddyTeams || []).map(bt => bt.team_id)
        const currentAssignedTeamIds = (currentBuddyTeams || []).map(bt => bt.team_id)
        const memberTeamIds = (memberTeams || []).map(tm => tm.team_id)

        const availableTeams = campusTeams
            .filter(team => {
                if (otherAssignedTeamIds.includes(team.id)) {
                    return false
                }
                if (memberTeamIds.includes(team.id)) {
                    return false
                }
                return true
            })
            .map(team => ({
                ...team,
                assigned: currentAssignedTeamIds.includes(team.id)
            }))

        return { availableTeams }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch teams"
        return { error: message, availableTeams: [] }
    }
}

export async function assignTeams(teamIds: string[]) {
    try {
        const supabase = await createClient()
        const user = await getMyProfile()

        if (!user) {
            throw new Error("Unauthorized")
        }

        const buddyId = await getBuddyId()
        if (!buddyId) {
            throw new Error("Not a buddy")
        }

        const { error: deleteError } = await supabase
            .from("buddy_teams")
            .delete()
            .eq("buddy_id", buddyId)

        if (deleteError) throw deleteError

        if (teamIds.length > 0) {
            const { error: insertError } = await supabase
                .from("buddy_teams")
                .insert(teamIds.map(teamId => ({ buddy_id: buddyId, team_id: teamId })))

            if (insertError) throw insertError
        }

        return { success: true }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to assign teams"
        return { error: message }
    }
}
