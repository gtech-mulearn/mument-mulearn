"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { createCheckpointAction } from "@/actions"
import { useToast } from "@/components/ToastProvider"

interface CreateCheckpointProps {
    availableTeams?: { id: string, team_name: string }[]
}

export default function CreateCheckpoint({ availableTeams = [] }: CreateCheckpointProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const { show: showToast } = useToast()

    async function onSubmit(formData: FormData) {
        setLoading(true)
        await createCheckpointAction(formData)
        setLoading(false)
        setIsOpen(false)
        showToast({
            title: "Checkpoint Created",
            description: "The new checkpoint has been successfully created."
        })
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition w-full sm:w-auto justify-center"
            >
                <Plus size={18} />
                New Checkpoint
            </button>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800">New Checkpoint</h2>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <form action={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Week Number</label>
                        <input name="week_number" type="number" min={1} max={4} required placeholder="e.g. 1" className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Select Team</label>
                        {availableTeams.length > 0 ? (
                            <select name="team_id" required className="w-full p-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20">
                                <option value="">-- Choose a team --</option>
                                {availableTeams.map(t => (
                                    <option key={t.id} value={t.id}>{t.team_name}</option>
                                ))}
                            </select>
                        ) : (
                            <p className="text-sm text-red-500 p-2 bg-red-50 rounded-lg">No teams assigned to you.</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Remarks / Task</label>
                        <textarea name="summary" required rows={4} placeholder="Enter task details or remarks..." className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20" />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={() => setIsOpen(false)} className="flex-1 py-3 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl">
                            Cancel
                        </button>
                        <button disabled={loading || availableTeams.length === 0} type="submit" className="flex-1 py-3 bg-brand-blue text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50">
                            {loading ? "Creating..." : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
