import { getMyProfile } from "@/lib/profile"
import { getAdminSettings } from "@/lib/admin"
import { redirect } from "next/navigation"
import GeneralSettingsPanel from "./components/GeneralSettingsPanel"

export default async function SettingsPage() {
    const user = await getMyProfile()

    // Check Access - Only admins can access settings
    if (!user || user.role !== "admin") {
        redirect("/dashboard")
    }

    // Fetch settings server-side
    const settings = await getAdminSettings()

    // If settings don't exist, show error
    if (!settings) {
        return (
            <div className="py-8 px-6 max-w-4xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">Failed to load settings. Please try again later.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="py-8 px-6 max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
                <p className="text-slate-500">Manage platform-wide settings and configurations.</p>
            </header>

            <div className="space-y-6">
                <GeneralSettingsPanel initialSettings={settings} />
            </div>
        </div>
    )
}
