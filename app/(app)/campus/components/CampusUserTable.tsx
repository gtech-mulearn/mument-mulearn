"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AdminUserView } from "@/lib/admin"
import { Role } from "@/types/user"
import { Search, Loader2, X, Edit2 } from "lucide-react"
import CampusSearchableSelect from "./CampusSearchableSelect"
import CampusEditUserDialog from "./CampusEditUserDialog"

interface Props {
    users: AdminUserView[]
    districts: { id: string, name: string }[]
    campuses: { id: string, name: string }[]
    currentPage: number
    totalPages: number
}

const ROLES: Role[] = ["participant", "buddy"]

export default function CampusUserTable({ users, districts, campuses, currentPage, totalPages }: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    const [editingUser, setEditingUser] = useState<AdminUserView | null>(null)
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams)
        if (value && value !== "all") {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        params.set("page", "1")
        startTransition(() => router.push(`?${params.toString()}`))
    }

    const clearFilters = () => {
        startTransition(() => router.push("?"))
        setSearchTerm("")
    }

    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams)
        params.set("page", page.toString())
        startTransition(() => router.push(`?${params.toString()}`))
    }

    const hasFilters = searchParams.toString().length > 0 && searchParams.get("page") !== "1"

    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
                <div className="space-y-4 md:space-y-0 md:flex md:items-center md:gap-4 flex-1">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name..."
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 bg-gray-50/50 focus:bg-white transition-all"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                handleFilterChange("search", e.target.value)
                            }}
                        />
                    </div>

                    {/* Role Filter */}
                    <div className="w-full md:w-36">
                        <CampusSearchableSelect
                            options={ROLES.map(r => ({ id: r, name: r.charAt(0).toUpperCase() + r.slice(1).replace('_', ' ') }))}
                            value={searchParams.get("role") || "all"}
                            onChange={(val) => handleFilterChange("role", val)}
                            placeholder="Roles"
                        />
                    </div>

                    {/* Clear Button */}
                    {hasFilters || searchTerm ? (
                        <button
                            onClick={clearFilters}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            title="Clear Filters"
                        >
                            <X size={20} />
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">District</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{user.full_name}</p>
                                                <p className="text-xs text-gray-400">{user.email || "No email"}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-xs font-medium">
                                                {user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {user.district_name || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setEditingUser(user)}
                                                className="p-2 text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit User"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1 || isPending}
                            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages || isPending}
                            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            {editingUser && (
                <CampusEditUserDialog
                    user={{
                        ...editingUser,
                        email: editingUser.email || null
                    }}
                    isOpen={!!editingUser}
                    onClose={() => setEditingUser(null)}
                    districts={districts}
                    campuses={campuses}
                />
            )}
        </div>
    )
}
