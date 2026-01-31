"use client"

import React, { useState } from 'react'
import { updatePasswordAction } from "@/actions"
import { Loader2, Save, Key } from "lucide-react"
import { useToast } from "@/components/ToastProvider"

export default function UpdatePasswordForm() {
    const { show } = useToast()
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const password = String(formData.get("password"))
        const confirm = String(formData.get("confirmPassword"))

        if (password !== confirm) {
            show({ title: "Error", description: "Passwords do not match" })
            setLoading(false)
            return
        }

        try {
            await updatePasswordAction(formData)
            show({ title: "Success", description: "Password updated successfully" })
            // Optional: reset form
            e.currentTarget.reset()
        } catch (error: any) {
            show({ title: "Error", description: error.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                    <input
                        name="password"
                        type="password"
                        required
                        minLength={6}
                        className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                        placeholder="••••••••"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
                    <input
                        name="confirmPassword"
                        type="password"
                        required
                        minLength={6}
                        className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-blue text-white font-semibold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Update Password
            </button>
        </form>
    )
}
