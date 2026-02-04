"use client"

import { Flame, Check, TrendingUp, AlertOctagon , ArrowBigUpDash, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"

interface PersonalStatData {
    totalUpdates?: number
    totalUpvotes?: number
    averageUpvotesPerUpdate?: number
    streakDays?: number
    hasUpdatedToday?: boolean
}

interface Props {
    stats: PersonalStatData
}

export default function PersonalStats({ stats }: Props) {

    const router = useRouter();

    // console.log(stats.streakDays)
    // stats.hasUpdatedToday = true // For demo purposes only, remove this line in production  ;

    return (
        <div className="space-y-6">
            {/* Today's Update Status */}
            <div className={`${stats.hasUpdatedToday ? 'bg-white' : 'bg-red-600'} p-6 rounded-2xl border border-gray-100 shadow-sm`}>
                <div className="flex items-center justify-between">
                    <div className={`flex flex-col ${stats.hasUpdatedToday ? 'text-green-600' : 'text-white'}`}>
                        <h3 className="text-lg font-semibold mb-1">Today's Update</h3>
                        <p className="text-sm">One update per day - Keeps the µment going!</p>
                        </div>
                    <div className={`flex items-center justify-center w-16 h-16 rounded-full ${stats.hasUpdatedToday ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {stats.hasUpdatedToday ? (
                            <Check className="w-8 h-8 text-green-600" />
                        ) : (
                            <AlertOctagon className="w-8 h-8 text-red-600" />
                        )}
                    </div>
                </div>
                <div className="flex justify-between gap-6 mt-5">
                <p className={`mt-4 text-sm ${stats.hasUpdatedToday ? 'text-green-600' : 'text-white'}`}>
                    {stats.hasUpdatedToday ? '✓ You have completed today\'s update' : 'No update yet today.'}
                </p>
                { stats.hasUpdatedToday ? null : <button onClick={() => router.push('/daily-update')} className="bg-white p-3 rounded-xl text-red-700">Daily Updates</button>}
                </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-800">Personal Analytics</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Updates */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-slate-600 text-sm font-medium mb-2">Total Updates</h3>
                    <div className="flex items-center space-x-2">
                    <Calendar className="inline text-blue-500"/>
                    <p className="text-3xl font-bold text-blue-500">{stats.totalUpdates || 0}</p>
                    </div>
                </div>

                {/* Total Upvotes */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-slate-600 text-sm font-medium mb-2">Total Upvotes</h3>
                    <div className="flex items-center space-x-2">
                    <ArrowBigUpDash className="inline text-blue-600"/>
                    <p className="text-3xl font-bold text-blue-600">{stats.totalUpvotes || 0}</p>
                    </div>
                </div>

                {/* Average Upvotes */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-slate-600 text-sm font-medium mb-2">Avg. Upvotes/Update</h3>
                    <div className="flex items-center space-x-2">
                        <TrendingUp className="inline text-green-600"/>    
                        <p className="text-3xl font-bold text-green-600">{(stats.averageUpvotesPerUpdate || 0).toFixed(1)}</p> 
                    </div>
                    
                </div>

                {/* Streak */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-slate-600 text-sm font-medium mb-2">Current Streak</h3>
                    <div className="flex items-center space-x-2">
                        <Flame className="inline fill-orange-600 text-orange-600"/>
                        <p className="text-3xl font-bold text-orange-600">{stats.streakDays || 0} days</p>
                    </div>
                </div>
            </div>

            
        </div>
    )
}
