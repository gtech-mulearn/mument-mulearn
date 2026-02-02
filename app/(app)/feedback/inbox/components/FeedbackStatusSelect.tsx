"use client"

import { updateFeedbackStatusAction } from "@/actions"
import { Loader2, CheckCircle2, Clock, CheckCircle } from "lucide-react"
import { useState, useTransition } from "react"

export default function FeedbackStatusSelect({ id, currentStatus }: { id: string, currentStatus: string }) {
    const [isPending, startTransition] = useTransition()
    const [status, setStatus] = useState(currentStatus || 'new')

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value
        setStatus(newStatus)
        startTransition(async () => {
            try {
                await updateFeedbackStatusAction(id, newStatus)
            } catch (err) {
                console.error("Failed to update status", err)
                // revert on error?
            }
        })
    }

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'completed': return 'text-green-600 bg-green-50 border-green-200'
            case 'closed': return 'text-slate-600 bg-slate-100 border-slate-200'
            case 'work_in_progress': return 'text-amber-600 bg-amber-50 border-amber-200'
            default: return 'text-blue-600 bg-blue-50 border-blue-200' // new/submitted
        }
    }

    return (
        <div className="flex items-center gap-2">
            <div className={`relative flex items-center ${isPending ? 'opacity-70' : ''}`}>
                <select
                    value={status}
                    onChange={handleChange}
                    disabled={isPending}
                    className={`appearance-none pl-3 pr-8 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-300 transition-colors ${getStatusColor(status)}`}
                >
                    <option value="new">Submitted</option>
                    <option value="work_in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>
                {isPending && (
                    <Loader2 size={12} className="absolute right-2 text-slate-400 animate-spin" />
                )}
            </div>
        </div>
    )
}
