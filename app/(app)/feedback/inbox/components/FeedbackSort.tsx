
"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ArrowUpDown } from "lucide-react"

export default function FeedbackSort() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentSort = searchParams.get("sort") || "newest"

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const params = new URLSearchParams(searchParams)
        params.set("sort", e.target.value)
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="flex items-center gap-2">
            <ArrowUpDown size={14} className="text-slate-400" />
            <select
                value={currentSort}
                onChange={handleSortChange}
                className="bg-transparent text-sm font-medium text-slate-600 focus:outline-none cursor-pointer hover:text-slate-800"
            >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
            </select>
        </div>
    )
}
