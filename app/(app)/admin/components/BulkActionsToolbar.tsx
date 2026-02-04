"use client"

import { useState, useTransition } from "react"
import { X, Loader2, Copy } from "lucide-react"
import { Role } from "@/types/user"
import { bulkUpdateUsersAction } from "@/actions"
import { useToast } from "@/components/ToastProvider"
import SearchableSelect from "./SearchableSelect"

interface UpdateResult {
    success: number
    failed: number
    errors: Array<{ userId: string; error: string }>
}

interface Props {
    selectedUserIds: string[]
    onClose: () => void
    districts: { id: string; name: string }[]
    campuses: { id: string; name: string }[]
    currentUserRole?: Role
    currentUserCampusId?: string | null
}

const ROLES: Role[] = ["participant", "buddy", "campus_coordinator", "qa_foreman", "qa_watcher", "zonal_lead", "admin"]

// Helper to translate error messages into user-friendly ones
const formatErrorMessage = (error: string): string => {
    if (error.includes("only edit users from your campus")) {
        return "You don't have permission to update this user. It belongs to a different campus."
    }
    if (error.includes("can only assign Participant or Buddy roles")) {
        return "Your role only allows assigning Participant or Buddy roles."
    }
    if (error.includes("Account not linked to a campus")) {
        return "Your account is not properly configured. Please contact an administrator."
    }
    if (error.includes("Unauthorized")) {
        return "You don't have permission to perform this action."
    }
    if (error.includes("violates not-null constraint")) {
        return "Fill all the required fields."
    }
    return error
}

export default function BulkActionsToolbar({
    selectedUserIds,
    onClose,
    districts,
    campuses,
    currentUserRole
}: Props) {
    const [isPending, startTransition] = useTransition()
    const [updates, setUpdates] = useState({
        role: "",
        district_id: "",
        campus_id: ""
    })
    const [result, setResult] = useState<UpdateResult | null>(null)
    const { show: showToast } = useToast()

    const allowedRoles = currentUserRole === "campus_coordinator" ? ["buddy"] : ROLES

    const handleApplyUpdates = () => {
        if (!updates.role && !updates.district_id && !updates.campus_id) {
            showToast({
                title: "Missing Selection",
                description: "Please select at least one field to update (Role, District, or Campus)."
            })
            return
        }

        const updatePayload: Record<string, string> = {}
        if (updates.role) updatePayload.role = updates.role
        if (updates.district_id) updatePayload.district_id = updates.district_id
        if (updates.campus_id) updatePayload.campus_id = updates.campus_id

        startTransition(async () => {
            try {
                const res = await bulkUpdateUsersAction(selectedUserIds, updatePayload as { role?: Role; district_id?: string; campus_id?: string })
                setResult(res)
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to update users"
                const friendlyMessage = formatErrorMessage(message)
                showToast({
                    title: "Update Failed",
                    description: friendlyMessage
                })
            }
        })
    }

    if (result) {
        return (
            <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h2 className="text-lg font-bold text-slate-800">Update Complete</h2>
                        <button
                            onClick={() => {
                                setResult(null)
                                onClose()
                            }}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-green-50 rounded-lg p-3">
                                <div className="text-2xl font-bold text-green-600">{result.success}</div>
                                <div className="text-xs text-slate-600">Updated Successfully</div>
                            </div>
                            <div className="bg-red-50 rounded-lg p-3">
                                <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                                <div className="text-xs text-slate-600">Failed</div>
                            </div>
                        </div>

                        {result.errors.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <h4 className="font-medium text-red-900 text-sm mb-2">Failed Updates:</h4>
                                <ul className="space-y-1 text-xs text-red-800 max-h-40 overflow-y-auto">
                                    {result.errors.map((err, i) => (
                                        <li key={i}>
                                            <strong>{err.userId.slice(0, 8)}:</strong> {formatErrorMessage(err.error)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setResult(null)
                                onClose()
                            }}
                            className="w-full px-4 py-2.5 rounded-xl bg-brand-blue text-white font-semibold hover:brightness-110 active:scale-[0.95] transition-all"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white border-t border-gray-100 p-4 sticky bottom-0 rounded-xl z-30 shadow-lg shadow-black/30">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                    <Copy size={18} className="text-brand-blue" />
                    <span className="font-semibold text-slate-700">{selectedUserIds.length} user(s) selected</span>
                    <button
                        onClick={onClose}
                        className="text-sm text-slate-500 hover:text-slate-700 font-medium"
                    >
                        Clear selection
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-3 items-center w-full md:w-auto">
                    <div className="w-full md:w-40">
                        <SearchableSelect
                            options={allowedRoles.map(r => ({ id: r, name: r.charAt(0).toUpperCase() + r.slice(1).replace('_', ' ') }))}
                            value={updates.role || ""}
                            onChange={(val) => setUpdates({ ...updates, role: val })}
                            placeholder="Select role..."
                        />
                    </div>

                    {currentUserRole !== "campus_coordinator" && (
                        <>
                            <div className="w-full md:w-44">
                                <SearchableSelect
                                    options={districts}
                                    value={updates.district_id || ""}
                                    onChange={(val) => setUpdates({ ...updates, district_id: val })}
                                    placeholder="Select district..."
                                />
                            </div>

                            <div className="w-full md:w-56">
                                <SearchableSelect
                                    options={campuses}
                                    value={updates.campus_id || ""}
                                    onChange={(val) => setUpdates({ ...updates, campus_id: val })}
                                    placeholder="Select campus..."
                                />
                            </div>
                        </>
                    )}

                    <button
                        onClick={handleApplyUpdates}
                        disabled={isPending}
                        className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-brand-blue text-white font-semibold hover:brightness-110 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.95] transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        {isPending && <Loader2 size={16} className="animate-spin" />}
                        Apply Changes
                    </button>
                </div>
            </div>
        </div>
    )
}
