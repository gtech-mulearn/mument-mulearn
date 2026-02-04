"use client"

import { useState, useTransition } from "react"
import { Upload, X, AlertCircle, CheckCircle2, Loader2, Download } from "lucide-react"
import { Role } from "@/types/user"
import { bulkImportUsersAction } from "@/actions"
import { useToast } from "@/components/ToastProvider"

interface Props {
    isOpen: boolean
    onClose: () => void
    districts: { id: string; name: string }[]
    campuses: { id: string; name: string }[]
    currentUserRole?: Role
    currentUserCampusId?: string | null
    currentUserDistrictId?: string
}

const CSV_TEMPLATE = `full_name,email,password,role,district_id,campus_id
John Doe,john@example.com,password123,participant,district-1,campus-1
Jane Smith,jane@example.com,password123,buddy,district-1,campus-1`

interface ParsedUser {
    full_name: string
    email: string
    password: string
    role: Role
    district_id: string
    campus_id: string
}

interface ImportResult {
    success: number
    failed: number
    errors: Array<{ email: string; error: string }>
}

// Helper function to provide user-friendly error messages
const getErrorMessage = (fieldName: string, issue: string, details?: string): string => {
    const messages: Record<string, Record<string, string>> = {
        full_name: {
            missing: "Name is required. Please enter a full name."
        },
        email: {
            invalid: "Email format is incorrect. Please use a valid email (e.g., user@example.com).",
            missing: "Email is required."
        },
        password: {
            short: "Password is too short. Use at least 6 characters.",
            missing: "Password is required."
        },
        role: {
            invalid: `Role '${details}' is not recognized. Valid roles: Participant, Buddy, Campus Coordinator, QA Foreman, QA Watcher, Zonal Lead, Admin.`
        },
        district_id: {
            missing: "District is required. Please select a district from the template."
        },
        campus_id: {
            missing: "Campus is required. Please select a campus from the template."
        },
        permission: {
            restricted_role: "Your role only allows adding Buddies.",
            restricted_campus: "You can only add users to your assigned campus.",
            restricted_district: "You can only add users to your assigned district."
        }
    }
    
    return messages[fieldName]?.[issue] || `${fieldName}: ${issue}`
}

export default function BulkImportDialog({
    isOpen,
    onClose,
    currentUserRole,
    currentUserCampusId,
    currentUserDistrictId
}: Props) {
    const [isPending, startTransition] = useTransition()
    const [csvData, setCsvData] = useState("")
    const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([])
    const [validationErrors, setValidationErrors] = useState<string[]>([])
    const [importResult, setImportResult] = useState<ImportResult | null>(null)
    const { show: showToast } = useToast()

    if (!isOpen) return null

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const content = event.target?.result as string
            setCsvData(content)
            parseCSV(content)
        }
        reader.readAsText(file)
    }

    const parseCSV = (csv: string) => {
        setValidationErrors([])
        const lines = csv.trim().split("\n")
        if (lines.length < 2) {
            setValidationErrors(["Please provide at least one user in your CSV (header + 1 user row)."])
            setParsedUsers([])
            return
        }

        const headers = lines[0].split(",").map(h => h.trim().toLowerCase())
        const requiredHeaders = ["full_name", "email", "password", "role", "district_id", "campus_id"]

        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
        if (missingHeaders.length > 0) {
            setValidationErrors([
                `Your CSV is missing required columns: ${missingHeaders.join(", ")}. Download the template for the correct format.`
            ])
            setParsedUsers([])
            return
        }

        const users: ParsedUser[] = []
        const errors: string[] = []

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue

            const values = lines[i].split(",").map(v => v.trim())
            const user: Record<string, string> = {}

            for (let j = 0; j < headers.length; j++) {
                user[headers[j]] = values[j] || ""
            }

            // Validation
            if (!user.full_name) {
                errors.push(`Row ${i + 1}: ${getErrorMessage("full_name", "missing")}`)
            }
            if (!user.email || !user.email.includes("@")) {
                errors.push(`Row ${i + 1}: ${getErrorMessage("email", "invalid")}`)
            }
            if (!user.password || user.password.length < 6) {
                errors.push(`Row ${i + 1}: ${getErrorMessage("password", "short")}`)
            }
            if (!user.role || !["participant", "buddy", "campus_coordinator", "qa_foreman", "qa_watcher", "zonal_lead", "admin"].includes(user.role)) {
                errors.push(`Row ${i + 1}: ${getErrorMessage("role", "invalid", user.role)}`)
            }
            if (!user.district_id) {
                errors.push(`Row ${i + 1}: ${getErrorMessage("district_id", "missing")}`)
            }
            if (!user.campus_id) {
                errors.push(`Row ${i + 1}: ${getErrorMessage("campus_id", "missing")}`)
            }

            // Campus coordinator restrictions
            if (currentUserRole === "campus_coordinator") {
                if (user.role !== "buddy") {
                    errors.push(`Row ${i + 1}: ${getErrorMessage("permission", "restricted_role")}`)
                }
                if (user.campus_id !== currentUserCampusId) {
                    errors.push(`Row ${i + 1}: ${getErrorMessage("permission", "restricted_campus")}`)
                }
                if (user.district_id !== currentUserDistrictId) {
                    errors.push(`Row ${i + 1}: ${getErrorMessage("permission", "restricted_district")}`)
                }
            }

            if (errors.length === 0) {
                users.push(user as unknown as ParsedUser)
            }
        }

        setValidationErrors(errors)
        setParsedUsers(users)
    }

    const handleImport = () => {
        if (validationErrors.length > 0 || parsedUsers.length === 0) {
            return
        }

        startTransition(async () => {
            try {
                const result = await bulkImportUsersAction(parsedUsers)
                setImportResult(result)
                if (result.success > 0) {
                    showToast({
                        title: "Import Successful",
                        description: `${result.success} user(s) imported successfully.`
                    })
                }
                if (result.failed > 0) {
                    showToast({
                        title: "Import Completed with Errors",
                        description: `${result.failed} user(s) failed to import. Check details below.`
                    })
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to import users"
                showToast({
                    title: "Import Failed",
                    description: message
                })
                setValidationErrors([message])
            }
        })
    }

    const handleClose = () => {
        setCsvData("")
        setParsedUsers([])
        setValidationErrors([])
        setImportResult(null)
        onClose()
    }

    const downloadTemplate = () => {
        const element = document.createElement("a")
        const file = new Blob([CSV_TEMPLATE], { type: "text/csv" })
        element.href = URL.createObjectURL(file)
        element.download = "user-import-template.csv"
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-brand-blue/10 rounded-lg text-brand-blue">
                            <Upload size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Bulk Import Users</h2>
                            <p className="text-xs text-slate-500">Import multiple users from a CSV file.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {!importResult ? (
                        <>
                            {/* Step 1: CSV Input */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-sm font-semibold text-slate-700">CSV Data</label>
                                    <button
                                        type="button"
                                        onClick={downloadTemplate}
                                        className="text-xs text-brand-blue hover:underline flex items-center gap-1"
                                    >
                                        <Download size={14} />
                                        Download Template
                                    </button>
                                </div>
                                <textarea
                                    value={csvData}
                                    onChange={(e) => {
                                        setCsvData(e.target.value)
                                        parseCSV(e.target.value)
                                    }}
                                    placeholder="full_name,email,password,role,district_id,campus_id&#10;John Doe,john@example.com,password123,participant,district-1,campus-1"
                                    className="w-full h-32 p-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all font-mono text-sm"
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    Paste CSV data or upload a file. Required columns: full_name, email, password, role, district_id, campus_id
                                </p>
                            </div>

                            {/* File Upload */}
                            <div className="flex justify-center">
                                <label className="flex items-center gap-2 px-4 py-2 bg-brand-blue/10 text-brand-blue rounded-xl cursor-pointer hover:bg-brand-blue/20 transition-colors">
                                    <Upload size={16} />
                                    <span className="text-sm font-medium">Upload CSV File</span>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {/* Validation Errors */}
                            {validationErrors.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle size={16} className="text-red-600" />
                                        <h3 className="font-semibold text-red-900">Validation Errors ({validationErrors.length})</h3>
                                    </div>
                                    <ul className="space-y-1 text-sm text-red-800">
                                        {validationErrors.slice(0, 5).map((error, i) => (
                                            <li key={i}>• {error}</li>
                                        ))}
                                        {validationErrors.length > 5 && (
                                            <li className="text-red-600 font-medium">... and {validationErrors.length - 5} more</li>
                                        )}
                                    </ul>
                                </div>
                            )}

                            {/* Preview */}
                            {parsedUsers.length > 0 && validationErrors.length === 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CheckCircle2 size={16} className="text-green-600" />
                                        <h3 className="font-semibold text-green-900">Ready to Import ({parsedUsers.length} users)</h3>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {parsedUsers.slice(0, 5).map((user, i) => (
                                            <div key={i} className="text-sm text-green-800 bg-green-100/30 rounded p-2">
                                                {user.full_name} ({user.email}) - {user.role}
                                            </div>
                                        ))}
                                        {parsedUsers.length > 5 && (
                                            <div className="text-sm text-green-600 font-medium">... and {parsedUsers.length - 5} more</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-slate-700 font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={parsedUsers.length === 0 || validationErrors.length > 0 || isPending}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-brand-blue text-white font-semibold hover:brightness-110 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.95] transition-all flex items-center justify-center gap-2"
                                >
                                    {isPending && <Loader2 size={18} className="animate-spin" />}
                                    Import Users
                                </button>
                            </div>
                        </>
                    ) : (
                        /* Results */
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <h3 className="font-semibold text-blue-900 mb-3">Import Results</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-white rounded-lg p-3">
                                        <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                                        <div className="text-xs text-slate-600">Successfully Imported</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-3">
                                        <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                                        <div className="text-xs text-slate-600">Failed</div>
                                    </div>
                                </div>

                                {importResult.errors.length > 0 && (
                                    <div className="bg-red-50 rounded-lg p-3 mt-3">
                                        <h4 className="font-medium text-red-900 text-sm mb-2">Failed Imports:</h4>
                                        <ul className="space-y-1 text-sm text-red-800 max-h-40 overflow-y-auto">
                                            {importResult.errors.map((err, i) => (
                                                <li key={i}>
                                                    <strong>{err.email}:</strong> {err.error}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-brand-blue text-white font-semibold hover:brightness-110 active:scale-[0.95] transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
