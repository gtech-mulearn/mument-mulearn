"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/components/ToastProvider"
import { Loader2, ChevronDown, Search } from "lucide-react"

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
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [dropdownOpen, setDropdownOpen] = useState(false)

    useEffect(() => {
        fetchTeams()
    }, [])

    const fetchTeams = async () => {
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
            setSelectedTeams(new Set(assigned))
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "An error occurred"
            show({
                title: "Error",
                description: errorMsg,
            })
        } finally {
            setLoading(false)
        }
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

    const filteredTeams = availableTeams.filter(team =>
        team.team_name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const selectedTeamsList = availableTeams.filter(team => selectedTeams.has(team.id))

    if (loading) {
        return (
            <div className="w-full max-w-2xl">
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold">Assign Teams</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Select teams to verify...
                        </p>
                    </div>
                    <div className="w-full flex items-center justify-center px-4 py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-2xl">
            <div className="space-y-4">
                {/* Header */}
                <div>
                    <h3 className="text-lg font-semibold">Assign Teams</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Select teams to verify. You can only verify teams in your campus that are not already assigned to another buddy.
                    </p>
                </div>

                {/* Search/Filter Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        disabled={disabled || availableTeams.length === 0}
                        className="w-full flex items-center justify-between px-4 py-3 border rounded-lg bg-white hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder={availableTeams.length === 0 ? "No teams available" : "Search teams..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                disabled={availableTeams.length === 0}
                                className="bg-transparent outline-none w-full text-sm disabled:opacity-50"
                            />
                        </div>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Content */}
                    {dropdownOpen && availableTeams.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                            {filteredTeams.length === 0 ? (
                                <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                                    No teams found
                                </div>
                            ) : (
                                filteredTeams.map(team => (
                                    <label
                                        key={team.id}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-b last:border-b-0"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedTeams.has(team.id)}
                                            onChange={() => handleTeamToggle(team.id)}
                                            disabled={disabled || saving}
                                            className="w-4 h-4 cursor-pointer"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">{team.team_name}</div>
                                        </div>
                                        {team.assigned && (
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded whitespace-nowrap">
                                                Current
                                            </span>
                                        )}
                                    </label>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Selected Teams Container */}
                {selectedTeamsList.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Selected Teams ({selectedTeamsList.length})</p>
                        <div className="bg-muted/30 border rounded-lg p-4 space-y-2">
                            {selectedTeamsList.map(team => (
                                <div key={team.id} className="flex items-center justify-between bg-white rounded-md px-3 py-2 border">
                                    <span className="text-sm font-medium">{team.team_name}</span>
                                    <button
                                        onClick={() => handleTeamToggle(team.id)}
                                        disabled={disabled || saving}
                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {availableTeams.length === 0 && (
                    <div className="bg-muted/30 border rounded-lg p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            No teams available to assign. All teams in your campus are either assigned to another buddy or you are a member of them.
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                {availableTeams.length > 0 && (
                    <div className="flex gap-2 justify-end pt-2">
                        <button
                            onClick={fetchTeams}
                            disabled={saving}
                            className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                            Refresh
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={disabled || saving || availableTeams.length === 0}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
                        >
                            {saving ? (
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
