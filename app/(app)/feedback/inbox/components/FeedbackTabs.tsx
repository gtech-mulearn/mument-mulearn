
"use client"

import { useRouter, useSearchParams } from "next/navigation"

export default function FeedbackTabs({ counts }: { counts: { new: number, work_in_progress: number, completed: number, all: number } }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentStatus = searchParams.get("status") || "all"

    const tabs = [
        { id: "all", label: "All", count: counts.all },
        { id: "new", label: "Submitted", count: counts.new },
        { id: "work_in_progress", label: "In Progress", count: counts.work_in_progress },
        { id: "completed", label: "Completed", count: counts.completed }
    ]

    const handleTabChange = (status: string) => {
        const params = new URLSearchParams(searchParams)
        if (status === "all") {
            params.delete("status")
        } else {
            params.set("status", status)
        }
        params.delete("page") // Reset to page 1 on filter change
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="flex space-x-1 border-b border-slate-200 w-full mb-6 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
                const isActive = currentStatus === tab.id
                return (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`
                            px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative
                            ${isActive
                                ? "text-blue-600 border-b-2 border-blue-600"
                                : "text-slate-500 hover:text-slate-700 hover:border-slate-300"
                            }
                        `}
                    >
                        {tab.label}
                        <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                            {tab.count}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
