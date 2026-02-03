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

export interface PersonalStat {
    totalUpdates: number
    totalUpvotes: number
    averageUpvotesPerUpdate: number
    streakDays: number
    hasUpdatedToday: boolean
}

export async function getDailyUpdateStats(): Promise<DailyUpdateStat[]> {
    const supabase = await createClient()

    // Get updates from last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6) // Include today
    sevenDaysAgo.setHours(0, 0, 0, 0)

    // Fetch all updates from last 7 days using pagination (Supabase has 1000 row limit)
    let allData: Array<{ created_at: string }> = []
    let page = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
        const { data, error } = await supabase
            .from("daily_updates")
            .select("created_at")
            .gte("created_at", sevenDaysAgo.toISOString())
            .order("created_at", { ascending: true })
            .range(page * pageSize, (page + 1) * pageSize - 1)

        if (error) {
            console.error("Error fetching daily stats:", error)
            break
        }

        if (!data || data.length === 0) {
            hasMore = false
        } else {
            allData = allData.concat(data)
            if (data.length < pageSize) {
                hasMore = false
            }
            page++
        }
    }

    console.log(`Fetched ${allData.length} total updates across ${page} page(s)`)

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
    allData.forEach((update) => {
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

    // Fetch only campus_id to avoid large headers from joining colleges
    const { data: profiles } = await supabase
        .from("profiles")
        .select("campus_id")
        .not("campus_id", "is", null)

    if (!profiles) return []

    // Group by campus_id
    const countMap = new Map<string, number>()
    profiles.forEach((p) => {
        if (p.campus_id) {
            countMap.set(p.campus_id, (countMap.get(p.campus_id) || 0) + 1)
        }
    })

    // Get college names for all campuses
    const allCampusIds = Array.from(countMap.keys())

    const { data: colleges } = await supabase
        .from("colleges")
        .select("id, name")
        .in("id", allCampusIds)

    const collegeMap = new Map(colleges?.map(c => [c.id, c.name]) || [])

    // Sort by count desc and return all
    return Array.from(countMap.entries())
        .map(([campusId, count]) => ({ name: collegeMap.get(campusId) || "Unknown", count }))
        .sort((a, b) => b.count - a.count)
}

export async function getDistrictStats(): Promise<DistrictStat[]> {
    const supabase = await createClient()

    // Fetch only district_id to avoid large headers from joining districts
    const { data: profiles } = await supabase
        .from("profiles")
        .select("district_id")
        .not("district_id", "is", null)

    if (!profiles) return []

    // Group by district_id
    const countMap = new Map<string, number>()
    profiles.forEach((p) => {
        if (p.district_id) {
            countMap.set(p.district_id, (countMap.get(p.district_id) || 0) + 1)
        }
    })

    // Get district names
    const districtIds = Array.from(countMap.keys())
    const { data: districts } = await supabase
        .from("districts")
        .select("id, name")
        .in("id", districtIds)

    const districtMap = new Map(districts?.map(d => [d.id, d.name]) || [])

    return Array.from(countMap.entries())
        .map(([districtId, count]) => ({ name: districtMap.get(districtId) || "Unknown", count }))
        .sort((a, b) => b.count - a.count)
}

export async function getPersonalStats(userId: string): Promise<PersonalStat> {
    const supabase = await createClient()

    // Fetch user's daily updates
    const { data: updates, error: updatesError } = await supabase
        .from("daily_updates")
        .select("id, created_at, upvote_count")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

    if (updatesError) {
        console.error("Error fetching personal updates:", updatesError)
        return {
            totalUpdates: 0,
            totalUpvotes: 0,
            averageUpvotesPerUpdate: 0,
            streakDays: 0,
            hasUpdatedToday: false
        }
    }

    const totalUpdates = updates?.length || 0
    const totalUpvotes = updates?.reduce((sum, u) => sum + (u.upvote_count || 0), 0) || 0
    const averageUpvotesPerUpdate = totalUpdates > 0 ? totalUpvotes / totalUpdates : 0

    // Check if user has updated today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const hasUpdatedToday = updates?.some(u => {
        const updateDate = new Date(u.created_at)
        updateDate.setHours(0, 0, 0, 0)
        return updateDate.getTime() === today.getTime()
    }) || false

    // Calculate streak (consecutive days with updates, starting from today or yesterday)
    let streakDays = 0
    if (updates && updates.length > 0) {
        // Get unique dates from updates, sorted newest first
        const uniqueDates = Array.from(
            new Set(updates.map(u => new Date(u.created_at).toDateString()))
        ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

        if (uniqueDates.length > 0) {
            // Determine starting date: today or yesterday
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)

            const latestUpdateDate = new Date(uniqueDates[0])
            latestUpdateDate.setHours(0, 0, 0, 0)

            // Only count streak if latest update is today or yesterday
            if (latestUpdateDate.getTime() === today.getTime() || latestUpdateDate.getTime() === yesterday.getTime()) {
                // Start counting from the latest update
                let currentCheckDate = new Date(latestUpdateDate)
                for (let i = 0; i < uniqueDates.length; i++) {
                    const checkDate = new Date(uniqueDates[i])
                    checkDate.setHours(0, 0, 0, 0)
                    if (checkDate.getTime() === currentCheckDate.getTime()) {
                        streakDays++
                        currentCheckDate.setDate(currentCheckDate.getDate() - 1)
                    } else {
                        break
                    }
                }
            }
        }
    }

    return {
        totalUpdates,
        totalUpvotes,
        averageUpvotesPerUpdate,
        streakDays,
        hasUpdatedToday
    }
}
