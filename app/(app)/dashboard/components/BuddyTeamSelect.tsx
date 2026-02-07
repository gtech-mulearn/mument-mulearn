"use client"

import { useEffect, useState, useCallback } from "react"
import { useToast } from "@/components/ToastProvider"
import { Loader2 } from "lucide-react"

interface Team {
    id: string
    team_name: string
    assigned?: boolean
}

interface BuddyTeamSelectProps {
    onSave?: (selectedTeams: string[]) => void
    disabled?: boolean
}

export default function BuddyTeamSelect({ onSave, disabled = false }: BuddyTeamSelectProps) {
    const { show } = useToast()
    const [availableTeams, setAvailableTeams] = useState<Team[]>([])
    const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set())
    const [originalTeams, setOriginalTeams] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [disabledState, setDisabledState] = useState(false)

    const fetchTeams = useCallback(async () => {
        try {
            setLoading(true)

            // Fetch available teams (not assigned to other buddies)
            const response = await fetch("/api/buddy/available-teams")
            if (!response.ok) {
                throw new Error("Failed to fetch teams")
            }

            const data = await response.json()
            setAvailableTeams(data.availableTeams || [])

            // Set initially selected teams
            const assigned = (data.availableTeams || [])
                .filter((team: Team) => team.assigned)
                .map((team: Team) => team.id)
            const assignedSet: Set<string> = new Set(assigned)
            setSelectedTeams(assignedSet)
            setOriginalTeams(assignedSet)
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "An error occurred"
            show({
                title: "Error",
                description: errorMsg,
            })
        } finally {
            setLoading(false)
        }
    }, [show])

    useEffect(() => {
        fetchTeams()
    }, [fetchTeams])

    useEffect(() => {
        setDisabledState(disabled)
    }, [disabled])

    const hasChanges = () => {
        if (selectedTeams.size !== originalTeams.size) {
            return true
        }
        for (const team of selectedTeams) {
            if (!originalTeams.has(team)) {
                return true
            }
        }
        return false
    }

    const handleTeamToggle = (teamId: string) => {
        const newSelected = new Set(selectedTeams)
        if (newSelected.has(teamId)) {
            newSelected.delete(teamId)
        } else {
            newSelected.add(teamId)
        }
        setSelectedTeams(newSelected)
    }

    const handleSave = async () => {
        try {
            setSaving(true)

            const response = await fetch("/api/buddy/assign-teams", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teamIds: Array.from(selectedTeams),
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to save team assignments")
            }

            show({
                title: "Success",
                description: "Team assignments saved successfully!",
            })
            setOriginalTeams(new Set(selectedTeams))
            onSave?.(Array.from(selectedTeams))
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "An error occurred"
            show({
                title: "Error",
                description: errorMsg,
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="w-full">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            </div>
        )
    }

    return (
        <div className="w-full">
            <div>
                <h3 className="text-lg font-semibold">Assign Teams</h3>
                <p className="text-sm text-muted-foreground">
                    Select teams to verify. You can only verify teams in your campus that are not already assigned to another buddy.
                </p>
            </div>
            <div className="space-y-6">
                <div className="space-y-3">
                    {availableTeams.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No teams available to assign. All teams in your campus are either assigned to another buddy or you are a member of them.
                        </p>
                    ) : (
                        [...availableTeams]
                            .sort((a, b) => a.team_name.localeCompare(b.team_name))
                            .map(team => (
                            <div key={team.id} className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                                <input
                                    type="checkbox"
                                    id={`team-${team.id}`}
                                    checked={selectedTeams.has(team.id)}
                                    onChange={() => handleTeamToggle(team.id)}
                                    disabled={disabledState || saving}
                                    className="w-4 h-4 cursor-pointer"
                                />
                                <label
                                    htmlFor={`team-${team.id}`}
                                    className="flex-1 cursor-pointer font-medium text-sm"
                                >
                                    {team.team_name}
                                </label>
                                {team.assigned && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        Currently assigned
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {availableTeams.length > 0 && (
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={fetchTeams}
                            disabled={saving}
                            className="px-4 py-2 border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Refresh
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={disabledState || saving || !hasChanges()}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {disabledState ? (
                                "Disabled"
                            ) : saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                `Save (${selectedTeams.size})`
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
