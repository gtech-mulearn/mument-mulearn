"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ToastProvider"
import Link from "next/link"
import { List } from "lucide-react"

export default function FeedbackSubmitPage() {
    const router = useRouter()
    const { show } = useToast()
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const form = e.currentTarget
        const fd = new FormData(form)
        const subject = String(fd.get("subject") ?? "").trim()
        const description = String(fd.get("description") ?? "").trim()
        const category = String(fd.get("category") ?? "").trim()

        if (!subject || !description || !category) {
            show({ title: "Missing fields", description: "Please fill all fields." })
            return
        }

        setLoading(true)
        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ subject, description, category }),
            })

            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                show({ title: "Submission failed", description: err?.error ?? "Unable to submit feedback" })
                setLoading(false)
                return
            }

            show({ title: "Feedback submitted", description: "Thanks for your input!" })
            // navigate after a short delay so user sees toast
            setTimeout(() => router.push("/feedback/my-feedback"), 700)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            show({ title: "Error", description: message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-6">

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 space-y-6">

                {/* Header inside the card */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                    <div>
                        <h1 className="text-2xl font-bold text-brand-blue">Submit Feedback</h1>
                        <p className="text-sm text-slate-500 mt-1">Share your thoughts, report issues, or suggest improvements.</p>
                    </div>
                    <Link
                        href="/feedback/my-feedback"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-brand-blue font-semibold rounded-lg hover:bg-slate-100 transition-colors text-sm w-fit border border-brand-blue/10"
                    >
                        <List size={16} />
                        My Feedbacks
                    </Link>
                </div>

                <hr className="border-slate-50" />

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                    <select name="category" defaultValue="general" className="w-full p-3 rounded-xl border border-gray-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue">
                        <option value="general">General</option>
                        <option value="bug">Report a Bug</option>
                        <option value="feature">Feature Request</option>
                        <option value="complaint">Complaint</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                    <input name="subject" required placeholder="Brief summary" className="w-full p-3 rounded-xl border border-gray-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                    <textarea name="description" required rows={5} placeholder="Detailed explanation..." className="w-full p-3 rounded-xl border border-gray-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
                </div>

                <button type="submit" disabled={loading} aria-busy={loading} className={`w-full bg-brand-blue text-white font-semibold py-3 rounded-xl transition-colors ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700'}`}>
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                            Submitting...
                        </span>
                    ) : (
                        'Submit Feedback'
                    )}
                </button>
            </form>
        </div>
    )
}