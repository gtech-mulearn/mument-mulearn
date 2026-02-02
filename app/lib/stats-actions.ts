'use server'

import { createClient } from "@/lib/supabase/server"

export interface DailyUpdateStat {
    date: string
    count: number
}

export async function getCampusDailyUpdateStats(campusName: string): Promise<DailyUpdateStat[]> {
    const supabase = await createClient()

    // Get updates from last 7 days for specific campus
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
        .from("daily_updates")
        .select("created_at, colleges:college_id(name)")
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: true })

    if (error) {
        console.error("Error fetching campus daily stats:", error)
        return []
    }

    // Filter by campus and aggregate
    const statsMap = new Map<string, number>()
    for (let i = 0; i < 7; i++) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        statsMap.set(key, 0)
    }

    data.forEach((update) => {
        if (update.created_at) {
            const collegeData = Array.isArray(update.colleges) ? update.colleges[0] : update.colleges
            if (collegeData?.name === campusName) {
                const dateKey = new Date(update.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                if (statsMap.has(dateKey)) {
                    statsMap.set(dateKey, (statsMap.get(dateKey) || 0) + 1)
                }
            }
        }
    })

    return Array.from(statsMap.entries())
        .map(([date, count]) => ({ date, count }))
        .reverse()
}
