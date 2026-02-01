import { createClient } from "@/lib/supabase/server"

export interface DailyUpdateStat {
    date: string
    count: number
}

export interface CampusStat {
    name: string
    count: number
}

export interface DistrictStat {
    name: string
    count: number
}

export async function getDailyUpdateStats(): Promise<DailyUpdateStat[]> {
    const supabase = await createClient()

    // Get updates from last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6) // Include today
    sevenDaysAgo.setHours(0, 0, 0, 0)

    // Fetch raw counts grouping by date is hard in Supabase JS without RPC
    // So we fetch all updates from last 7 days and aggregate in JS (assuming scale allows)
    // For high scale, use RPC or Materialized View
    const { data, error } = await supabase
        .from("daily_updates")
        .select("created_at")
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: true })

    if (error) {
        console.error("Error fetching daily stats:", error)
        return []
    }

    // Initialize map with last 7 days
    const statsMap = new Map<string, number>()
    for (let i = 0; i < 7; i++) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        // Format: "Jan 31"
        const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        statsMap.set(key, 0)
    }

    // Aggregate
    data.forEach((update) => {
        if (update.created_at) {
            const dateKey = new Date(update.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            if (statsMap.has(dateKey)) {
                statsMap.set(dateKey, (statsMap.get(dateKey) || 0) + 1)
            }
        }
    })

    // Convert to array and reverse to show oldest to newest
    return Array.from(statsMap.entries())
        .map(([date, count]) => ({ date, count }))
        .reverse()
}

export async function getCampusStats(): Promise<CampusStat[]> {
    const supabase = await createClient()

    // Fetch profiles with campus info
    // Ideally use RPC for aggregation: SELECT campus_id, COUNT(*) ...
    // Using JS aggregation for MVP
    const { data: profiles } = await supabase
        .from("profiles")
        .select(`
            campus_id,
            colleges ( name )
        `)
        .not("campus_id", "is", null)

    if (!profiles) return []

    const countMap = new Map<string, number>()

    profiles.forEach((p) => {
        // @ts-expect-error - Supabase type inference limitation for joins
        const name = p.colleges?.name || "Unknown"
        countMap.set(name, (countMap.get(name) || 0) + 1)
    })

    // Sort by count desc and take top 5
    return Array.from(countMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
}

export async function getDistrictStats(): Promise<DistrictStat[]> {
    const supabase = await createClient()

    const { data: profiles } = await supabase
        .from("profiles")
        .select(`
            district_id,
            districts ( name )
        `)
        .not("district_id", "is", null)

    if (!profiles) return []

    const countMap = new Map<string, number>()

    profiles.forEach((p) => {
        // @ts-expect-error - Supabase type inference limitation for joins
        const name = p.districts?.name || "Unknown"
        countMap.set(name, (countMap.get(name) || 0) + 1)
    })

    return Array.from(countMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
}
