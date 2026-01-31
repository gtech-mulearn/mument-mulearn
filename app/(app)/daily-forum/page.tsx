import { Calendar, Send } from "lucide-react";
import { User } from "lucide-react";
import { getDailyUpdates } from "@/lib/daily-updates";
import { Suspense } from "react";

const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-pink-500', 'bg-yellow-500', 'bg-indigo-500'];

function LoadingSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="mb-4 p-4 border border-slate-200 rounded-lg shadow-sm flex gap-4 animate-pulse">
                    <div className="bg-slate-200 p-2 rounded-lg w-10 h-10 shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-1/2" />
                        <div className="h-4 bg-slate-200 rounded w-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}

async function DailyForumContent() {
    const dailyUpdates = await getDailyUpdates();

    if (dailyUpdates.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500">
                No daily updates yet.
            </div>
        );
    }

    return (
        <div>
            {dailyUpdates.map((entry, index) => (
                <div key={entry.id} className="mb-4 p-4 border border-slate-200 rounded-lg shadow-sm flex gap-4">
                    <div className={`${colors[index % colors.length]} p-2 rounded-lg h-fit text-white shrink-0`}>
                        <Send size={24} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <Calendar size={14} className="inline-block mr-1 text-slate-400" />
                                <span className="text-sm text-slate-500">
                                    {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                            <div>
                                <User size={14} className="inline-block mr-1 text-slate-400" />
                                <span className="text-sm font-medium text-slate-700">
                                    {(entry as { user_name?: string }).user_name ?? 'Anonymous'}
                                </span>
                            </div>
                        </div>
                        <p className="text-slate-800">{entry.content}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function DailyForumPage() {
    return (
        <div>
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-blue-500">Daily Forum</h1>
                <p className="text-sm text-slate-500">See Daily Update of Others</p>
            </header>
            <Suspense fallback={<LoadingSkeleton />}>
                <DailyForumContent />
            </Suspense>
        </div>
    );
}
