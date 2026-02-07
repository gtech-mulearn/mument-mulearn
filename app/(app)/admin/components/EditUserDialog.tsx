"use client"

import { useState, useTransition } from "react"
import { updateUserProfileAction } from "@/actions"
import { Role } from "@/types/user"
import { Loader2, X, Save } from "lucide-react"
import { useToast } from "@/components/ToastProvider"

interface Props {
    user: {
        id: string
        full_name: string
        role: Role
        district_id: string
        campus_id: string | null
        email: string | null
        team_id: string | null
    }
    isOpen: boolean
    onClose: () => void
    districts: { id: string, name: string }[]
    campuses: { id: string, name: string }[]
    teams: { id: string, name: string, team_code: string, campus_id: string }[]
    currentUserRole: Role
    currentUserCampusId?: string | null
    currentUserDistrictId?: string
    currentUserTeamId?: string | null
}

const ROLES: Role[] = ["participant", "buddy", "campus_coordinator", "qa_foreman", "qa_watcher", "zonal_lead", "admin"]

export default function EditUserDialog({
    user, isOpen, onClose, districts, campuses, teams,
    currentUserRole, currentUserCampusId, currentUserDistrictId, currentUserTeamId
}: Props) {
    const [isPending, startTransition] = useTransition()
    const { show: showToast } = useToast()
    const [formData, setFormData] = useState({
        role: user.role,
        full_name: user.full_name,
        district_id: user.district_id,
        campus_id: user.campus_id || "",
        email: user.email || "",
        team_id: user.team_id || ""
    })

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        startTransition(async () => {
            try {
                await updateUserProfileAction(user.id, formData)
                onClose()
            } catch (error) {
                console.error(error)
                showToast({
                    title: "Update Failed",
                    description: error instanceof Error ? error.message : "Failed to update user"
                })
            }
        })
    }

    const isCoordinator = currentUserRole === "campus_coordinator"
    const allowedRoles = isCoordinator ? ["participant", "buddy"] : ROLES
    
    // Filter teams based on user's campus
    const filteredTeams = user.campus_id 
        ? teams.filter(team => team.campus_id === user.campus_id)
        : teams
    
    // Get current team details for display
    const currentTeam = user.team_id ? teams.find(t => t.id === user.team_id) : null
    const isTeamChanged = formData.team_id !== (user.team_id || "")
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Edit User</h2>
                        <p className="text-xs text-slate-500">{user.full_name}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email (Handle with Care)</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                            placeholder="user@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                            placeholder="Full Name"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Team</label>
                        {currentTeam && (
                            <p className="text-xs text-slate-500 mb-2 p-2 bg-slate-50 rounded-lg">Current: <span className="font-semibold text-slate-700">[{currentTeam.team_code}] {currentTeam.name}</span></p>
                        )}
                        <select
                            value={formData.team_id}
                            onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                            className={`w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all ${
                                isTeamChanged ? 'ring-2 ring-blue-400' : ''
                            }`}
                            disabled={!user.campus_id}
                        >
                            <option value="">{user.campus_id ? 'Select Team (Optional)' : 'No campus assigned'}</option>
                            {filteredTeams.map(t => (
                                <option key={t.id} value={t.id} selected={t.id === user.team_id}>[{t.team_code}] {t.name}</option>
                            ))}
                        </select>
                        {!user.campus_id && (
                            <p className="text-xs text-orange-600 mt-1">Assign a campus first to enable team selection</p>
                        )}
                        {isTeamChanged && (
                            <p className="text-xs text-blue-600 mt-1 font-semibold">✓ Team change pending</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Role</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                            className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                        >
                            {allowedRoles.map(role => (
                                <option key={role} value={role}>{role.replace('_', ' ').toUpperCase()}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">District</label>
                        <select
                            value={formData.district_id}
                            onChange={(e) => setFormData({ ...formData, district_id: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all disabled:bg-gray-100 disabled:text-gray-500"
                            disabled={isCoordinator}
                        >
                            <option value="">Select District</option>
                            {districts.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Campus</label>
                        <select
                            value={formData.campus_id}
                            onChange={(e) => setFormData({ ...formData, campus_id: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all disabled:bg-gray-100 disabled:text-gray-500"
                            disabled={isCoordinator}
                        >
                            <option value="">Select Campus</option>
                            {campuses.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-slate-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 px-4 py-2.5 bg-brand-blue text-white font-medium rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
