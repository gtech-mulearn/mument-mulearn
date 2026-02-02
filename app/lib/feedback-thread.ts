
import { createClient } from "@/lib/supabase/server"
import { getMyProfile } from "./profile"

export interface FeedbackReply {
    id: string
    created_at: string
    message: string
    is_admin_reply: boolean
    user: {
        id: string
        full_name: string
        role: string
    }
}

export interface FeedbackReaction {
    id: string
    emoji: string
    user_id: string
    target_id: string // feedback_id or reply_id
}

export interface FeedbackThread {
    feedback: {
        id: string
        subject: string
        description: string
        status: string
        category: string
        created_at: string
        created_by: {
            id: string
            full_name: string
        }
    }
    replies: FeedbackReply[]
    reactions: FeedbackReaction[]
}

export async function getFeedbackThread(feedbackId: string): Promise<FeedbackThread | null> {
    const supabase = await createClient()

    // 1. Fetch Feedback Details (Raw)
    const { data: feedback, error: feedbackError } = await supabase
        .from("feedback")
        .select(`id, subject, description, status, category, created_at, created_by`)
        .eq("id", feedbackId)
        .single()

    if (feedbackError) {
        console.error("Error fetching feedback thread:", feedbackError)
        return null
    }
    if (!feedback) return null

    // 1a. Fetch Creator Profile manually
    const { data: creatorProfile } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", feedback.created_by)
        .single()

    const enrichedFeedback = {
        ...feedback,
        created_by: creatorProfile || { id: feedback.created_by, full_name: "Unknown User" }
    }

    // 2. Fetch Replies
    const { data: replies } = await supabase
        .from("feedback_replies")
        .select(`id, created_at, message, is_admin_reply, user_id`)
        .eq("feedback_id", feedbackId)
        .order("created_at", { ascending: true })

    // 2a. Fetch Reply Users
    let enrichedReplies: FeedbackReply[] = []
    if (replies && replies.length > 0) {
        const userIds = Array.from(new Set(replies.map(r => r.user_id)))
        const { data: users } = await supabase
            .from("profiles")
            .select("id, full_name, role")
            .in("id", userIds)

        const userMap = new Map(users?.map(u => [u.id, u]) || [])

        enrichedReplies = replies.map(r => ({
            ...r,
            user: userMap.get(r.user_id) || { id: r.user_id, full_name: "Unknown", role: "participant" }
        }))
    }

    // 3. Fetch Reactions (for both feedback and replies)
    const { data: postReactions } = await supabase
        .from("feedback_reactions")
        .select("id, emoji, user_id, feedback_id")
        .eq("feedback_id", feedbackId)

    let replyReactions: any[] = []
    if (replies && replies.length > 0) {
        const replyIds = replies.map(r => r.id)
        const { data } = await supabase
            .from("feedback_reactions")
            .select("id, emoji, user_id, reply_id")
            .in("reply_id", replyIds)
        replyReactions = data || []
    }

    // Combine reactions formatted
    const combinedReactions: FeedbackReaction[] = [
        ...(postReactions || []).map(r => ({ ...r, target_id: r.feedback_id })),
        ...replyReactions.map(r => ({ ...r, target_id: r.reply_id }))
    ]

    return {
        feedback: enrichedFeedback,
        replies: enrichedReplies,
        reactions: combinedReactions
    }
}

export async function postReply(feedbackId: string, message: string) {
    const supabase = await createClient()
    const profile = await getMyProfile()
    if (!profile) throw new Error("Unauthorized")

    const isAdmin = ["admin", "qa_watcher", "zonal_lead"].includes(profile.role)

    await supabase.from("feedback_replies").insert({
        feedback_id: feedbackId,
        user_id: profile.id,
        message,
        is_admin_reply: isAdmin
    })
}

export async function toggleReaction(targetId: string, targetType: 'feedback' | 'reply', emoji: string) {
    const supabase = await createClient()
    const profile = await getMyProfile()
    if (!profile) throw new Error("Unauthorized")

    // Check if exists
    const query = supabase.from("feedback_reactions")
        .select("id")
        .eq("user_id", profile.id)
        .eq("emoji", emoji)

    if (targetType === 'feedback') {
        query.eq("feedback_id", targetId)
    } else {
        query.eq("reply_id", targetId)
    }

    const { data: existing } = await query.single()

    if (existing) {
        // Remove
        await supabase.from("feedback_reactions").delete().eq("id", existing.id)
    } else {
        // Add
        await supabase.from("feedback_reactions").insert({
            user_id: profile.id,
            emoji,
            feedback_id: targetType === 'feedback' ? targetId : null,
            reply_id: targetType === 'reply' ? targetId : null
        })
    }
}
