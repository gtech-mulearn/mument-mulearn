"use client"

import { useState, useMemo } from "react"
import { Search, X, Download } from "lucide-react"
import { CheckpointWithJoins } from "@/lib/checkpoints"
import { Role } from "@/types/user"
import { exportCheckpointsToExcel } from "@/lib/excel-export"
import { useToast } from "@/components/ToastProvider"

interface CheckpointSearchProps {
    checkpoints: CheckpointWithJoins[]
    colleges: Array<{ id: string; name: string }>
    userRole: Role
    onFilterChange?: (filtered: CheckpointWithJoins[]) => void
}

export default function CheckpointSearch({ checkpoints, colleges, userRole, onFilterChange }: CheckpointSearchProps) {
    const [teamNameSearch, setTeamNameSearch] = useState("")
    const [selectedCollege, setSelectedCollege] = useState<string>("")
    const [selectedCheckpoint, setSelectedCheckpoint] = useState<string>("")
    const [isExporting, setIsExporting] = useState(false)
    const { show } = useToast()

    // Get unique checkpoint numbers from data
    const uniqueCheckpoints = useMemo(() => {
        const nums = new Set(checkpoints.map(c => c.checkpoint_number).filter(Boolean))
        return Array.from(nums).sort()
    }, [checkpoints])

    // Filter checkpoints based on search and filters
    const filteredCheckpoints = useMemo(() => {
        const filtered = checkpoints.filter(checkpoint => {
            // Team name filter
            if (teamNameSearch.trim()) {
                const teamName = checkpoint.teams?.team_name || ""
                if (!teamName.toLowerCase().includes(teamNameSearch.toLowerCase())) {
                    return false
                }
            }

            // College/Campus filter
            if (selectedCollege) {
                const collegeId = checkpoint.colleges?.id
                if (collegeId !== selectedCollege) {
                    return false
                }
            }

            // Checkpoint number filter
            if (selectedCheckpoint) {
                if (checkpoint.checkpoint_number !== parseInt(selectedCheckpoint)) {
                    return false
                }
            }

            return true
        })
        
        // Call the callback when filtered results change
        if (onFilterChange) {
            onFilterChange(filtered)
        }
        
        return filtered
    }, [checkpoints, teamNameSearch, selectedCollege, selectedCheckpoint, onFilterChange])

    const handleExport = async () => {
        try {
            setIsExporting(true)
            const selectedCollegeName = selectedCollege
                ? colleges.find((college) => college.id === selectedCollege)?.name
                : null

            const normalizedCollegeName = selectedCollegeName
                ? selectedCollegeName
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "")
                : ""

            const exportFileName = normalizedCollegeName
                ? `checkpoint-results-${normalizedCollegeName}`
                : "checkpoint-results"

            await exportCheckpointsToExcel(filteredCheckpoints, exportFileName)
            show({
                title: "Export completed",
                description: `${filteredCheckpoints.length} checkpoint records exported successfully.`
            })
        } catch (error) {
            console.error("Failed to export:", error)
            show({ title: "Export failed", description: "Failed to export checkpoints to Excel." })
        } finally {
            setIsExporting(false)
        }
    }

    const handleReset = () => {
        setTeamNameSearch("")
        setSelectedCollege("")
        setSelectedCheckpoint("")
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Search & Filter</h3>
                <span className="text-sm text-slate-500">
                    {filteredCheckpoints.length} of {checkpoints.length} results
                </span>
            </div>

            <div className={`grid gap-4 mb-4 ${userRole === "admin" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
                {/* Team Name Search */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Team Name
                    </label>
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search team name..."
                            value={teamNameSearch}
                            onChange={(e) => setTeamNameSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                        />
                    </div>
                </div>

                {/* College Filter - Only for Admins */}
                {userRole === "admin" && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            College/Campus
                        </label>
                        <select
                            value={selectedCollege}
                            onChange={(e) => setSelectedCollege(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                        >
                            <option value="">All Colleges</option>
                            {colleges.map(college => (
                                <option key={college.id} value={college.id}>
                                    {college.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Checkpoint Number Filter */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Checkpoint #
                    </label>
                    <select
                        value={selectedCheckpoint}
                        onChange={(e) => setSelectedCheckpoint(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    >
                        <option value="">All Checkpoints</option>
                        {uniqueCheckpoints.map(checkpointNum => (
                            <option key={checkpointNum} value={checkpointNum.toString()}>
                                Checkpoint {checkpointNum}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Action Buttons */}
                <div className="flex items-end gap-2">
                    <button
                        onClick={handleReset}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                    >
                        <X size={18} />
                        Reset
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={isExporting || filteredCheckpoints.length === 0}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        <Download size={18} />
                        {isExporting ? "Exporting..." : "Export"}
                    </button>
                </div>
            </div>

            {/* Filter Tags */}
            <div className="flex flex-wrap gap-2">
                {teamNameSearch && (
                    <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                        Team: {teamNameSearch}
                        <button
                            onClick={() => setTeamNameSearch("")}
                            className="hover:text-blue-900"
                        >
                            <X size={14} />
                        </button>
                    </span>
                )}
                {selectedCollege && userRole === "admin" && (
                    <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                        College: {colleges.find(c => c.id === selectedCollege)?.name}
                        <button
                            onClick={() => setSelectedCollege("")}
                            className="hover:text-blue-900"
                        >
                            <X size={14} />
                        </button>
                    </span>
                )}
                {selectedCheckpoint && (
                    <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                        Checkpoint: {selectedCheckpoint}
                        <button
                            onClick={() => setSelectedCheckpoint("")}
                            className="hover:text-blue-900"
                        >
                            <X size={14} />
                        </button>
                    </span>
                )}
            </div>
        </div>
    )
}
