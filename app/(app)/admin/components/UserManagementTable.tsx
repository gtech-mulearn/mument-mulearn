"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AdminUserView } from "@/lib/admin"
import { Role } from "@/types/user"
import { Search, Loader2, X, Filter, Edit2, UserPlus, Upload } from "lucide-react"
import SearchableSelect from "./SearchableSelect"
import EditUserDialog from "./EditUserDialog"
import CreateUserDialog from "./CreateUserDialog"
import BulkImportDialog from "./BulkImportDialog"
import BulkActionsToolbar from "./BulkActionsToolbar"

interface Props {
    users: AdminUserView[]
    districts: { id: string, name: string }[]
    campuses: { id: string, name: string }[]
    teams: { id: string, name: string, team_code: string, campus_id: string }[]
    currentPage: number
    totalPages: number
    currentUserRole: Role
    currentUserCampusId?: string | null
    currentUserDistrictId?: string
}

const ROLES: Role[] = ["participant", "buddy", "campus_coordinator", "qa_foreman", "qa_watcher", "zonal_lead", "admin"]

export default function UserManagementTable({
    users, districts, campuses, teams, currentPage, totalPages,
    currentUserRole, currentUserCampusId, currentUserDistrictId
}: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    const [editingUser, setEditingUser] = useState<AdminUserView | null>(null)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false)
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())

    // Local state for debounced search
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")

    const handleFilterChange = useCallback((key: string, value: string) => {
        const params = new URLSearchParams(searchParams)
        if (value && value !== "all") {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        params.set("page", "1") // Reset to page 1
        startTransition(() => {
            router.replace(`/admin?${params.toString()}`)
        })
    }, [searchParams, router])

    // Debounce Search Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== (searchParams.get("search") || "")) {
                handleFilterChange("search", searchTerm)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [searchTerm, handleFilterChange, searchParams])

    const clearFilters = () => {
        setSearchTerm("")
        startTransition(() => {
            router.replace("/admin")
        })
    }

    const handleSelectUser = (userId: string) => {
        const newSelected = new Set(selectedUserIds)
        if (newSelected.has(userId)) {
            newSelected.delete(userId)
        } else {
            newSelected.add(userId)
        }
        setSelectedUserIds(newSelected)
    }

    const handleSelectAll = () => {
        if (selectedUserIds.size === users.length) {
            setSelectedUserIds(new Set())
        } else {
            setSelectedUserIds(new Set(users.map(u => u.id)))
        }
    }

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams)
        params.set("page", newPage.toString())
        startTransition(() => {
            router.replace(`/admin?${params.toString()}`)
        })
    }

    const hasFilters = searchParams.toString().length > 0 && searchParams.get("page") !== "1"

    return (
        <div className="space-y-6">
            {/* Modern Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">

                <div className="space-y-4 md:space-y-0 md:flex md:items-center md:gap-4 flex-1">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-50">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name..."
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 bg-gray-50/50 focus:bg-white transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Filters Group */}
                    <div className="flex flex-col md:flex-row gap-3 md:items-center">
                        <div className="w-full md:w-36">
                            <SearchableSelect
                                options={ROLES.map(r => ({ id: r, name: r.charAt(0).toUpperCase() + r.slice(1).replace('_', ' ') }))}
                                value={searchParams.get("role") || "all"}
                                onChange={(val) => handleFilterChange("role", val)}
                                placeholder="Roles"
                            />
                        </div>

                        {currentUserRole !== "campus_coordinator" && (
                            <>
                                <div className="w-full md:w-44">
                                    <SearchableSelect
                                        options={districts}
                                        value={searchParams.get("district_id") || "all"}
                                        onChange={(val) => handleFilterChange("district_id", val)}
                                        placeholder="Districts"
                                    />
                                </div>

                                <div className="w-full md:w-56">
                                    <SearchableSelect
                                        options={campuses}
                                        value={searchParams.get("campus_id") || "all"}
                                        onChange={(val) => handleFilterChange("campus_id", val)}
                                        placeholder="Campuses"
                                    />
                                </div>
                            </>
                        )}

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

                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-blue text-white font-semibold rounded-xl hover:brightness-110 active:scale-[0.95] transition-all shadow-lg shadow-brand-blue/20 whitespace-nowrap"
                >
                    <UserPlus size={18} />
                    Add User
                </button>

                <button
                    onClick={() => setIsBulkImportOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 active:scale-[0.95] transition-all whitespace-nowrap"
                >
                    <Upload size={18} />
                    Bulk Import
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-4 w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedUserIds.size === users.length && users.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300 cursor-pointer"
                                    />
                                </th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Campus / District</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                                        <Filter size={32} className="opacity-20" />
                                        <p>No users found matching these filters.</p>
                                        <button onClick={clearFilters} className="text-brand-blue hover:underline text-xs">Clear all filters</button>
                                    </td>
                                </tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedUserIds.has(user.id)}
                                                onChange={() => handleSelectUser(user.id)}
                                                className="rounded border-gray-300 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-800">{user.full_name}</div>
                                            {user.email && <div className="text-xs text-slate-500 mb-0.5">{user.email}</div>}
                                            <div className="text-xs text-slate-400 font-mono opacity-60 group-hover:opacity-100 transition-opacity">
                                                {user.id.slice(0, 8)}...
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide
                                                ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                    user.role === 'buddy' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-slate-100 text-slate-800'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-700 font-medium">{user.campus_name || <span className="text-slate-400 italic">No Campus</span>}</div>
                                            <div className="text-xs text-slate-500">{user.district_name || "No District"}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setEditingUser(user)}
                                                className="text-slate-400 hover:text-brand-blue p-2 hover:bg-brand-blue/5 rounded-lg transition-colors"
                                                title="Edit User"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50/30">
                        <button
                            disabled={currentPage <= 1 || isPending}
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-slate-500 font-medium px-3 py-1 bg-gray-100 rounded-lg">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            disabled={currentPage >= totalPages || isPending}
                            onClick={() => handlePageChange(currentPage + 1)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm"
                        >
                            Next
                        </button>
                    </div>
                )}

                {isPending && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                        <div className="bg-white p-3 rounded-2xl shadow-xl border border-gray-100">
                            <Loader2 className="animate-spin text-brand-blue" size={24} />
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            {editingUser && (
                <EditUserDialog
                    user={{
                        ...editingUser,
                        email: editingUser.email || null
                    }}
                    isOpen={!!editingUser}
                    onClose={() => setEditingUser(null)}
                    districts={districts}
                    campuses={campuses}
                    teams={teams}
                    currentUserRole={currentUserRole}
                    currentUserCampusId={currentUserCampusId}
                    currentUserDistrictId={currentUserDistrictId}
                />
            )}

            {/* Create Dialog */}
            <CreateUserDialog
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                districts={districts}
                campuses={campuses}
                currentUserRole={currentUserRole}
                currentUserCampusId={currentUserCampusId}
                currentUserDistrictId={currentUserDistrictId}
            />

            {/* Bulk Import Dialog */}
            <BulkImportDialog
                isOpen={isBulkImportOpen}
                onClose={() => setIsBulkImportOpen(false)}
                districts={districts}
                campuses={campuses}
                currentUserRole={currentUserRole}
                currentUserCampusId={currentUserCampusId}
                currentUserDistrictId={currentUserDistrictId}
            />

            {/* Bulk Actions Toolbar */}
            {selectedUserIds.size > 0 && (
                <BulkActionsToolbar
                    selectedUserIds={Array.from(selectedUserIds)}
                    onClose={() => setSelectedUserIds(new Set())}
                    districts={districts}
                    campuses={campuses}
                    currentUserRole={currentUserRole}
                    currentUserCampusId={currentUserCampusId}
                />
            )}
        </div>
    )
}
