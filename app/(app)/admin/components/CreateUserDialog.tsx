"use client"

import { useState, useTransition } from "react"
import { Loader2, UserPlus, X } from "lucide-react"
import { Role } from "@/types/user"
import { createUserAction } from "@/actions"

interface Props {
    isOpen: boolean
    onClose: () => void
    districts: { id: string, name: string }[]
    campuses: { id: string, name: string }[]
}

const ROLES: Role[] = ["participant", "buddy", "campus_coordinator", "qa_foreman", "qa_watcher", "zonal_lead", "admin"]

export default function CreateUserDialog({ isOpen, onClose, districts, campuses }: Props) {
    const [isPending, startTransition] = useTransition()
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        password: "",
        role: "participant" as Role,
        district_id: "",
        campus_id: ""
    })

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.district_id) return alert("Please select a district")

        startTransition(async () => {
            try {
                await createUserAction(formData)
                onClose()
                // Reset form?
                setFormData({
                    full_name: "",
                    email: "",
                    password: "",
                    role: "participant",
                    district_id: "",
                    campus_id: ""
                })
            } catch (error: any) {
                console.error(error)
                alert(error.message || "Failed to create user")
            }
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-brand-blue/10 rounded-lg text-brand-blue">
                            <UserPlus size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Add User</h2>
                            <p className="text-xs text-slate-500">Create a new user with credentials.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                            placeholder="user@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                            placeholder="••••••••"
                            minLength={6}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Role</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                            className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                        >
                            {ROLES.map(role => (
                                <option key={role} value={role}>{role.replace(/_/g, " ").toUpperCase()}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">District</label>
                        <select
                            value={formData.district_id}
                            onChange={(e) => setFormData({ ...formData, district_id: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                            required
                        >
                            <option value="">Select District</option>
                            {districts.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Campus (Optional)</label>
                        <select
                            value={formData.campus_id}
                            onChange={(e) => setFormData({ ...formData, campus_id: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                        >
                            <option value="">Select Campus</option>
                            {campuses.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-6 py-2 bg-brand-blue text-white text-sm font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 shadow-lg shadow-brand-blue/20 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isPending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                            Create User
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
