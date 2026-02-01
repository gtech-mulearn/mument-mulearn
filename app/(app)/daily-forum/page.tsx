import { getDailyUpdates } from "@/lib/daily-updates";
import { getMyProfile } from "@/lib/profile";
import { Suspense } from "react";
import DailyForumFilter from "./components/DailyForumFilter";

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
    const userProfile = await getMyProfile();

    if (dailyUpdates.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500">
                No daily updates yet.
            </div>
        );
    }

    // Get unique colleges for filter dropdown
    const colleges = [...new Set(dailyUpdates
        .map((u: { college_name?: string }) => u.college_name)
        .filter((name): name is string => Boolean(name)))]
        .sort();

    return (
        <DailyForumFilter dailyUpdates={dailyUpdates} colleges={colleges} role={userProfile?.role} />
    );
}

export default function DailyForumPage() {
    return (
        <div>
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-blue-500">Daily Forum</h1>
                <p className="text-sm text-slate-500">See Daily Update of Others</p>
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                    <strong>Note:</strong> Now you can upvote the daily updates you find helpful! Click the Arrow icon on any update to show your appreciation and encourage more great content.
                </div>
            </header>
            <Suspense fallback={<LoadingSkeleton />}>
                <DailyForumContent />
            </Suspense>
        </div>
    );
}
