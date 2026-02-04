"use client"

import { ReactNode, useState } from "react"
import Sidebar from "@/components/layout/Sidebar"
import DashboardHeader from "@/components/layout/DashboardHeader"
import ToastProvider from "@/components/ToastProvider"
import InstallPrompt from "./components/InstallPrompt"
import { Role } from "@/types/user"

export default function AppShell({
    role,
    streak,
    children,
}: {
    role: Role
    streak: number
    children: ReactNode
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-redhat">

            {/* Sidebar */}
            <Sidebar
                role={role}
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Header */}
                <div className="p-3 md:p-4 pb-0">
                    <DashboardHeader streak={streak} onMenuClick={() => setSidebarOpen(true)} />
                </div>

                <main className="flex-1 overflow-y-auto p-3 md:p-8 custom-scrollbar">
                    <ToastProvider>
                        {children}
                        <InstallPrompt />
                    </ToastProvider>
                </main>
            </div>
        </div>
    )
}
