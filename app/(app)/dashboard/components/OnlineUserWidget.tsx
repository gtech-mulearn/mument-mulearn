import { getOnlineUserCount } from "@/lib/stats"
import { Users } from "lucide-react"

export default async function OnlineUserWidget() {
    const { onlineCount } = await getOnlineUserCount()

    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-linear-to-r from-brand-blue/10 to-brand-blue/5 border border-brand-blue/20 hover:border-brand-blue/40 transition-all">
            <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <Users size={16} className="text-brand-blue" />
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-semibold text-brand-blue">{onlineCount}</span>
                <span className="text-xs text-slate-500 leading-tight">Online Now</span>
            </div>
        </div>
    )
}
