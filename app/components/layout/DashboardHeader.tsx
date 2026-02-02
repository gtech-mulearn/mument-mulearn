"use client"

import { Menu, LogOut, Flame } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ToastProvider"
import NotificationCenter from "@/(app)/components/NotificationCenter"

export default function DashboardHeader({
    onMenuClick,
    streak = 0
}: {
    onMenuClick: () => void
    streak?: number
}) {
    const router = useRouter()
    const { show } = useToast()

    async function handleSignOut() {
        try {
            const res = await fetch('/api/auth/signout', { method: 'POST' })
            if (!res.ok) throw new Error('Sign out failed')
            show({ title: 'Signed out', description: 'You have been signed out.' })
            router.replace('/login')
        } catch (err: unknown) {
            const e = err as { message?: string }
            show({ title: 'Error', description: e?.message || 'Sign out failed' })
        }
    }

    return (
        <header className="relative space-y-2">

            {/* Top row */}
            <div className="flex items-center justify-between">

                {/* Left: hamburger + title */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onMenuClick}
                        className="md:hidden p-2 rounded-lg bg-brand-blue text-white"
                    >
                        <Menu size={20} />
                    </button>

                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-brand-blue">
                            Dashboard
                        </h1>
                        <p className="text-sm text-slate-500">Welcome back!</p>
                    </div>
                </div>

                {/* Right: date + sign out */}
                <div className="flex items-center gap-4">

                    {/* Streak Badge (High Visibility) */}
                    {streak > 0 && (
                        <div className="flex sm:flex-row items-center gap-3 px-3 py-1.5 bg-linear-to-r from-orange-500 to-red-600 text-white rounded-full shadow-lg animate-pulse hover:animate-none transition-all hover:scale-105 cursor-default" title="Maintain your streak!">
                            <Flame size={20} className="fill-white animate-bounce" />
                            <span className="font-black text-lg">{streak}</span>
                        </div>
                    )}

                    <NotificationCenter />


                    <p className="text-sm text-slate-400 hidden sm:block">
                        {new Date().toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                        })}
                    </p>
                    <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
                        <LogOut size={16} /> Sign out
                    </button>
                </div>
            </div>

            {/* Divider */}
            <div className="pt-2">
                <div className="h-px w-full bg-linear-to-r from-brand-blue/40 via-brand-yellow/60 to-transparent" />
            </div>
        </header>
    )
}
