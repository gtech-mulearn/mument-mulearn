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

    const handleProfileClick = () => {
        router.push('/profile')
    }

    return (
        <header className="relative space-y-2">

            {/* Top row */}
            <div className="flex items-center justify-between gap-2">

                {/* Left: hamburger + title */}
                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                    <button
                        onClick={onMenuClick}
                        className="md:hidden p-2 rounded-lg bg-brand-blue text-white"
                        aria-label="Menu"
                    >
                        <Menu size={18} />
                    </button>

                    <div>
                        <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-brand-blue">
                            Dashboard
                        </h1>
                        <p className="text-xs md:text-sm text-slate-500 hidden xs:block">Welcome back!</p>
                    </div>
                </div>

                {/* Right: date + sign out */}
                <div className="flex items-center gap-2 md:gap-4 shrink-0">

                    {/* Streak Badge */}
                    {streak > 0 && (
                        <div className="flex items-center gap-1.5 md:gap-3 px-2 md:px-3 py-1 md:py-1.5 bg-linear-to-r from-orange-500 to-red-600 text-white rounded-full shadow-lg hover:scale-105 transition-transform cursor-pointer" title="Maintain your streak!" onClick={handleProfileClick}>
                            <Flame size={14} className="fill-white md:w-5 md:h-5" />
                            <span className="font-black text-sm md:text-lg leading-none">{streak}</span>
                        </div>
                    )}

                    <NotificationCenter />


                    <p className="text-sm text-slate-400 hidden lg:block">
                        {new Date().toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                        })}
                    </p>
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 p-1 md:p-0"
                        title="Sign out"
                    >
                        <LogOut size={18} />
                        <span className="hidden md:inline">Sign out</span>
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
