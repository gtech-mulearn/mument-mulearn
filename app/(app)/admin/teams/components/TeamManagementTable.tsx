"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createTeamAction, updateTeamAction, deleteTeamAction } from "@/actions"
import { Team } from "@/lib/team"
import { Plus, Edit2, Trash2, Loader2, Check, X } from "lucide-react"
import { useToast } from "@/components/ToastProvider"
import SearchableTeamFilter from "./SearchableTeamFilter"

interface Props {
    teams: Team[]
    campuses: { id: string; name: string }[]
    currentPage: number
    totalPages: number
    searchQuery: string
    totalTeams: number
    currentUserRole: string
}

interface FormData {
    team_code: string
    team_name: string
    campus_id: string
}

export default function TeamManagementTable({
    teams,
    campuses,
    currentPage,
    totalPages,
    searchQuery,
    totalTeams,
    currentUserRole
}: Props) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { show: showToast } = useToast()
    const [editingTeam, setEditingTeam] = useState<Team | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [formData, setFormData] = useState<FormData>({
        team_code: "",
        team_name: "",
        campus_id: ""
    })
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams)
        params.set("page", newPage.toString())
        router.push(`?${params.toString()}`)
    }

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.team_code.trim() || !formData.team_name.trim() || !formData.campus_id) {
            showToast({ title: "Error", description: "All fields are required" })
            return
        }

        startTransition(async () => {
            try {
                const fd = new FormData()
                fd.append("team_code", formData.team_code)
                fd.append("team_name", formData.team_name)
                fd.append("campus_id", formData.campus_id)
                await createTeamAction(fd)
                setFormData({ team_code: "", team_name: "", campus_id: "" })
                setIsCreating(false)
                showToast({ title: "Success", description: "Team created successfully" })
            } catch (error) {
                showToast({
                    title: "Error",
                    description: error instanceof Error ? error.message : "Failed to create team"
                })
            }
        })
    }

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingTeam || !formData.team_code.trim() || !formData.team_name.trim() || !formData.campus_id) {
            showToast({ title: "Error", description: "All fields are required" })
            return
        }

        startTransition(async () => {
            try {
                const fd = new FormData()
                fd.append("team_code", formData.team_code)
                fd.append("team_name", formData.team_name)
                fd.append("campus_id", formData.campus_id)
                await updateTeamAction(editingTeam.id, fd)
                setEditingTeam(null)
                setFormData({ team_code: "", team_name: "", campus_id: "" })
                showToast({ title: "Success", description: "Team updated successfully" })
            } catch (error) {
                showToast({
                    title: "Error",
                    description: error instanceof Error ? error.message : "Failed to update team"
                })
            }
        })
    }

    const handleDelete = (teamId: string) => {
        startTransition(async () => {
            try {
                await deleteTeamAction(teamId)
                setDeletingId(null)
                showToast({ title: "Success", description: "Team deleted successfully" })
            } catch (error) {
                showToast({
                    title: "Error",
                    description: error instanceof Error ? error.message : "Failed to delete team"
                })
                setDeletingId(null)
            }
        })
    }

    return (
        <div className="space-y-6">
            {/* Search and Filter */}
            <SearchableTeamFilter teams={teams} campuses={campuses} searchQuery={searchQuery} totalTeams={totalTeams} currentUserRole={currentUserRole} />

            {/* Create Team Form */}
            {!isCreating ? (
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-blue text-white font-semibold rounded-xl hover:brightness-110 transition-all"
                >
                    <Plus size={18} />
                    Create Team
                </button>
            ) : (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Create New Team</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            <input
                                type="text"
                                placeholder="Team Code (e.g., TEAM001)"
                                value={formData.team_code}
                                onChange={(e) => setFormData({ ...formData, team_code: e.target.value })}
                                className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                                disabled={isPending}
                            />
                            <input
                                type="text"
                                placeholder="Team Name"
                                value={formData.team_name}
                                onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                                className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                                disabled={isPending}
                            />
                            <select
                                value={formData.campus_id}
                                onChange={(e) => setFormData({ ...formData, campus_id: e.target.value })}
                                className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                                disabled={isPending}
                            >
                                <option value="">Select Campus</option>
                                {campuses.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={isPending}
                                className="px-6 py-2.5 bg-brand-blue text-white font-medium rounded-xl hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-70"
                            >
                                {isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                Create
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCreating(false)
                                    setFormData({ team_code: "", team_name: "", campus_id: "" })
                                }}
                                disabled={isPending}
                                className="px-6 py-2.5 bg-white border border-gray-200 text-slate-600 font-medium rounded-xl hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Teams Table */}
            {teams.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-500">
                        {searchQuery ? "No teams match your search." : "No teams found. Create one to get started!"}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Team Code</th>
                                    <th className="px-6 py-4">Team Name</th>
                                    <th className="px-6 py-4">Campus</th>
                                    <th className="px-6 py-4">Created</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {teams.map((team) => (
                                    <tr key={team.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            {editingTeam?.id === team.id ? (
                                                <input
                                                    type="text"
                                                    value={formData.team_code}
                                                    onChange={(e) => setFormData({ ...formData, team_code: e.target.value })}
                                                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                                    disabled={isPending}
                                                />
                                            ) : (
                                                <span className="font-mono font-semibold text-slate-800">{team.team_code}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingTeam?.id === team.id ? (
                                                <input
                                                    type="text"
                                                    value={formData.team_name}
                                                    onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                                                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                                    disabled={isPending}
                                                />
                                            ) : (
                                                <span className="font-medium text-slate-800">{team.team_name}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingTeam?.id === team.id ? (
                                                <select
                                                    value={formData.campus_id}
                                                    onChange={(e) => setFormData({ ...formData, campus_id: e.target.value })}
                                                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                                    disabled={isPending}
                                                >
                                                    <option value="">Select Campus</option>
                                                    {campuses.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="text-slate-600">{team.campus_name || team.campus_id}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            {team.created_at ? new Date(team.created_at).toLocaleDateString() : "—"}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {editingTeam?.id === team.id ? (
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={handleUpdate}
                                                        disabled={isPending}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Save"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingTeam(null)
                                                            setFormData({ team_code: "", team_name: "", campus_id: "" })
                                                        }}
                                                        disabled={isPending}
                                                        className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Cancel"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => {
                                                            setEditingTeam(team)
                                                            setFormData({
                                                                team_code: team.team_code,
                                                                team_name: team.team_name,
                                                                campus_id: team.campus_id
                                                            })
                                                        }}
                                                        disabled={isPending || deletingId !== null}
                                                        className="p-2 text-brand-blue hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    {deletingId === team.id ? (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleDelete(team.id)}
                                                                disabled={isPending}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Confirm Delete"
                                                            >
                                                                {isPending ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                                            </button>
                                                            <button
                                                                onClick={() => setDeletingId(null)}
                                                                disabled={isPending}
                                                                className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Cancel"
                                                            >
                                                                <X size={18} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setDeletingId(team.id)}
                                                            disabled={isPending}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-sm text-slate-500">
                                Page {currentPage} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 text-slate-600 hover:bg-gray-50 disabled:opacity-50 transition-all"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 text-slate-600 hover:bg-gray-50 disabled:opacity-50 transition-all"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
