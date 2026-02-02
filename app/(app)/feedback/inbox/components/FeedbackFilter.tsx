
"use client"

import { useRouter, useSearchParams } from "next/navigation"

export default function FeedbackFilter() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentFilter = searchParams.get("status") || "all"

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const status = e.target.value
        if (status === "all") {
            router.push("/feedback/inbox")
        } else {
            router.push(`/feedback/inbox?status=${status}`)
        }
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 font-medium">Filter by:</span>
            <select
                value={currentFilter}
                onChange={handleFilterChange}
                className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 px-3 pr-8 min-w-[140px] shadow-sm cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
            >
                <option value="all">All Feedback</option>
                <option value="new">Submitted</option>
                <option value="work_in_progress">In Progress</option>
                <option value="completed">Completed</option>
            </select>
        </div>
    )
}
