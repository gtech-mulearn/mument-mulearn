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

export async function getFeedbackInbox(statusFilter?: string) {
    const supabase = await createClient()
    const user = await getMyProfile()

    if (!user || !permissions.canViewFeedbackInbox(user.role)) {
        return []
    }

    // 1. Fetch Feedback raw (No joins to avoid FK issues)
    let query = supabase.from("feedback").select("*").order("created_at", { ascending: false }).limit(50)

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
            return []
        }
    }

    const { data: feedbackData, error } = await query

    if (error) {
        console.error("Error fetching feedback:", error)
        return []
    }

    if (!feedbackData || feedbackData.length === 0) return []

    // 2. Collect IDs
    // 2. Collect IDs
    const userIds = Array.from(new Set(feedbackData.map((f) => f.created_by).filter(Boolean)))
    const campusIds = Array.from(new Set(feedbackData.map((f) => f.campus_id).filter(Boolean)))

    // 3. Fetch Linked Data in Parallel
    const [profilesResult, collegesResult] = await Promise.all([
        supabase.from("profiles").select("id, full_name").in("id", userIds as string[]),
        supabase.from("colleges").select("id, name").in("id", campusIds as string[])
    ])

    const profileMap = new Map(profilesResult.data?.map((p) => [p.id, p]) || [])
    const collegeMap = new Map(collegesResult.data?.map((c) => [c.id, c]) || [])

    // 4. Combine Data
    const formattedData: FeedbackView[] = feedbackData.map((f) => ({
        ...f,
        profiles: profileMap.get(f.created_by) || null,
        colleges: f.campus_id ? collegeMap.get(f.campus_id) : null
    }))

    return formattedData
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
