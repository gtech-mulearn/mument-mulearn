"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { updateAdminSettings } from "@/lib/settings"
import { type AdminSettings } from "@/lib/admin"

interface Props {
    initialSettings: AdminSettings
}

export default function GeneralSettingsPanel({ initialSettings }: Props) {
    const [settings, setSettings] = useState<AdminSettings>(initialSettings)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleCheckpointsToggle = async (enabled: boolean) => {
        try {
            setIsSaving(true)
            setError(null)
            setSuccess(false)

            const result = await updateAdminSettings(enabled, settings.allowed_checkpoint_number)

            if (!result.success) {
                setError(result.error || "Failed to update settings")
                return
            }

            setSettings({
                ...settings,
                checkpoints_enabled: enabled,
                updated_at: result.data?.updated_at || settings.updated_at
            })
            setSuccess(true)

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000)
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred")
        } finally {
            setIsSaving(false)
        }
    }

    const handleCheckpointNumberChange = async (checkpointNumber: number) => {
        try {
            setIsSaving(true)
            setError(null)
            setSuccess(false)

            const result = await updateAdminSettings(settings.checkpoints_enabled, checkpointNumber)

            if (!result.success) {
                setError(result.error || "Failed to update settings")
                return
            }

            setSettings({
                ...settings,
                allowed_checkpoint_number: checkpointNumber,
                updated_at: result.data?.updated_at || settings.updated_at
            })
            setSuccess(true)

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000)
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred")
        } finally {
            setIsSaving(false)
        }
    }


    if (!settings) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">Failed to load settings</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">General Settings</h2>

            {error && (
                <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {success && (
                <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-700">Settings updated successfully</p>
                </div>
            )}

            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                        <h3 className="font-medium text-slate-900">Checkpoints</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            {settings.checkpoints_enabled
                                ? "Checkpoints are currently enabled"
                                : "Checkpoints are currently disabled"}
                        </p>
                    </div>
                    <div>
                        <button
                            onClick={() =>
                                handleCheckpointsToggle(!settings.checkpoints_enabled)
                            }
                            disabled={isSaving}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                settings.checkpoints_enabled
                                    ? "bg-green-500 focus:ring-green-500"
                                    : "bg-slate-300 focus:ring-slate-400"
                            } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            <span
                                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                                    settings.checkpoints_enabled
                                        ? "translate-x-7"
                                        : "translate-x-1"
                                }`}
                            />
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-slate-900">Allowed Checkpoint Number</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Set which checkpoint number is available today (1-4)
                            </p>
                        </div>
                        <select
                            value={settings.allowed_checkpoint_number}
                            onChange={(e) => handleCheckpointNumberChange(parseInt(e.target.value))}
                            disabled={isSaving || !settings.checkpoints_enabled}
                            className="px-4 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value={1}>Checkpoint 1</option>
                            <option value={2}>Checkpoint 2</option>
                            <option value={3}>Checkpoint 3</option>
                            <option value={4}>Checkpoint 4</option>
                        </select>
                    </div>
                </div>

    

                {settings.updated_at && (
                    <p className="text-xs text-slate-500">
                        Last updated: {new Date(settings.updated_at).toLocaleString()}
                    </p>
                )}
            </div>
        </div>
    )
}
