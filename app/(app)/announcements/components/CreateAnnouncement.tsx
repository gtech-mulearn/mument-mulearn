"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { createAnnouncementAction } from "@/actions"
import { useToast } from "@/components/ToastProvider"

export default function CreateAnnouncement() {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const { show: showToast } = useToast()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const form = new FormData(e.currentTarget)

        await createAnnouncementAction(form)

        setLoading(false)
        setIsOpen(false)
        showToast({
            title: "Announcement Posted",
            description: "Your announcement has been successfully posted."
        })
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
            >
                <Plus size={18} />
                New Announcement
            </button>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Post Announcement</h2>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                        <textarea
                            name="content"
                            required
                            rows={6}
                            placeholder="What's happening?"
                            className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 placeholder:text-slate-400 text-slate-900"
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={() => setIsOpen(false)} className="flex-1 py-3 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl">
                            Cancel
                        </button>
                        <button disabled={loading} type="submit" className="flex-1 py-3 bg-brand-blue text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50">
                            {loading ? "Posting..." : "Post"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}