"use client"

import UpdatePasswordForm from "@/(app)/profile/components/UpdatePasswordForm"

export default function PasswordSettingsPage() {
    return (
        <div className="max-w-2xl mx-auto py-8 px-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Security Settings</h1>
            <p className="text-slate-500 mb-8">Manage your password and account security.</p>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Change Password</h2>
                <UpdatePasswordForm />
            </div>
        </div>
    )
}
