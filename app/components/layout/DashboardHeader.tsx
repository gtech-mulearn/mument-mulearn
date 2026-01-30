
import { Menu } from "lucide-react"

export default function DashboardHeader({
    onMenuClick,
}: {
    onMenuClick: () => void
}) {
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

                {/* Right: date */}
                <p className="text-sm text-slate-400 hidden sm:block">
                    {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                    })}
                </p>
            </div>

            {/* Divider */}
            <div className="pt-2">
                <div className="h-px w-full bg-gradient-to-r from-brand-blue/40 via-brand-yellow/60 to-transparent" />
            </div>
        </header>
    )
}
