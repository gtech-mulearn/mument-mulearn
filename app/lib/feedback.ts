import { createClient } from "@/lib/supabase/server"
import { getMyProfile } from "@/lib/profile"
import { permissions } from "@/lib/permissions"
import { Database } from "@/types/database.types"

export type Feedback = Database["public"]["Tables"]["feedback"]["Row"]

export type FeedbackView = Feedback & {
    profiles: {
        full_name: string
        email: string | null
    } | null
    colleges: {
        name: string
    } | null
    reactions?: any[]
}

export async function submitFeedback(data: {
    subject: string
    description: string
    category: string
}) {
    const supabase = await createClient()
    const user = await getMyProfile()

    if (!user) throw new Error("Unauthorized")

    const payload = {
        ...data,
        created_by: user.id,
        status: 'new',
        campus_id: user.campus_id || null
    }

    const { error } = await supabase.from("feedback").insert(payload)
    if (error) throw error
}

export async function getFeedbackInbox(statusFilter: string = 'all', page: number = 1, limit: number = 10, sort: string = 'newest') {
    const supabase = await createClient()
    const user = await getMyProfile()

    if (!user || !permissions.canViewFeedbackInbox(user.role)) {
        return { data: [], total: 0 }
    }

    // 1. Fetch Feedback raw (No joins to avoid FK issues)
    let query = supabase
        .from("feedback")
        .select("*", { count: "exact" })

    // Apply Sorting
    if (sort === 'oldest') {
        query = query.order("created_at", { ascending: true })
    } else {
        query = query.order("created_at", { ascending: false })
    }

    if (statusFilter && statusFilter !== 'all') {
        query = query.eq("status", statusFilter)
    }

    if (permissions.canViewAllFeedback(user.role)) {
        // No filter
    } else if (permissions.canViewGroupedFeedback(user.role)) {
        // Add group logic if needed
    } else if (user.role === "campus_coordinator") {
        if (user.campus_id) {
            query = query.eq("campus_id", user.campus_id)
        } else {
            return { data: [], total: 0 }
        }
    }

    // Apply Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: feedbackData, error, count } = await query

    if (error) {
        console.error("Error fetching feedback:", error)
        return { data: [], total: 0 }
    }

    if (!feedbackData || feedbackData.length === 0) return { data: [], total: 0 }

    // 2. Collect IDs
    const feedbackIds = feedbackData.map(f => f.id)
    const userIds = Array.from(new Set(feedbackData.map((f) => f.created_by).filter(Boolean)))
    const campusIds = Array.from(new Set(feedbackData.map((f) => f.campus_id).filter(Boolean)))

    // 3. Fetch Linked Data in Parallel
    const profilePromise = userIds.length > 0
        ? supabase.from("profiles").select("id, full_name, email").in("id", userIds as string[])
        : Promise.resolve({ data: [] })

    const collegePromise = campusIds.length > 0
        ? supabase.from("colleges").select("id, name").in("id", campusIds as string[])
        : Promise.resolve({ data: [] })

    // Fetch Reactions for these feedbacks
    const reactionPromise = feedbackIds.length > 0
        ? supabase.from("feedback_reactions").select("id, emoji, user_id, feedback_id").in("feedback_id", feedbackIds)
        : Promise.resolve({ data: [] })

    const [profilesResult, collegesResult, reactionsResult] = await Promise.all([
        profilePromise,
        collegePromise,
        reactionPromise
    ])

    const profileMap = new Map((profilesResult.data || []).map((p) => [p.id, p]))
    const collegeMap = new Map((collegesResult.data || []).map((c) => [c.id, c]))

    // Group reactions by feedback_id
    const reactionsMap = new Map<string, any[]>()

    reactionsResult.data?.forEach((r: any) => {
        const current = reactionsMap.get(r.feedback_id) || []
        current.push(r)
        reactionsMap.set(r.feedback_id, current)
    })

    // 4. Combine Data
    const formattedData: FeedbackView[] = feedbackData.map((f) => ({
        ...f,
        profiles: profileMap.get(f.created_by) || null,
        colleges: f.campus_id ? collegeMap.get(f.campus_id) : null,
        reactions: reactionsMap.get(f.id) || []
    }))

    return {
        data: formattedData,
        total: count || 0
    }
}

export async function getFeedbackStats() {
    const supabase = await createClient()
    const user = await getMyProfile()

    // Base query conditions logic reused?
    // For now assuming same permissions as inbox
    if (!user || !permissions.canViewFeedbackInbox(user.role)) {
        return { new: 0, work_in_progress: 0, completed: 0, all: 0 }
    }

    let query = supabase.from("feedback").select("status")

    if (user.role === "campus_coordinator" && user.campus_id) {
        query = query.eq("campus_id", user.campus_id)
    }

    const { data, error } = await query

    if (error || !data) return { new: 0, work_in_progress: 0, completed: 0, all: 0 }

    const stats = {
        new: 0,
        work_in_progress: 0,
        completed: 0,
        all: data.length
    }

    data.forEach((item) => {
        if (item.status === 'new') stats.new++
        if (item.status === 'work_in_progress') stats.work_in_progress++
        if (item.status === 'completed') stats.completed++
    })

    return stats
}

export async function getMyFeedback() {
    const supabase = await createClient()
    const user = await getMyProfile()

    if (!user) return []

    const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })

    if (error) {
        console.error("Error fetching my feedback:", error)
        return []
    }

    return data as Feedback[]
}

export async function updateFeedbackStatus(id: string, status: string) {
    const supabase = await createClient()
    // Verify permission
    const user = await getMyProfile()
    if (!user || !permissions.canViewFeedbackInbox(user.role)) {
        throw new Error("Unauthorized")
    }

    const { error } = await supabase
        .from("feedback")
        .update({ status })
        .eq("id", id)

    if (error) throw error
}
