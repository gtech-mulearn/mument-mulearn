
"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export default function Pagination({ total, limit }: { total: number, limit: number }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentPage = Number(searchParams.get("page")) || 1
    const totalPages = Math.ceil(total / limit)

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams)
        params.set("page", page.toString())
        router.push(`?${params.toString()}`)
    }

    if (totalPages <= 1) return null

    return (
        <div className="flex items-center justify-center gap-2 mt-8">
            <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-slate-600">
                Page {currentPage} of {totalPages}
            </span>
            <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    )
}
