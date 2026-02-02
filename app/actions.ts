"use server"

import { createAnnouncement as serviceCreateAnnouncement } from "@/lib/announcements"
import { createCheckpoint as serviceCreateCheckpoint, CheckpointScope } from "@/lib/checkpoints"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createAnnouncementAction(formData: FormData) {
    const content = formData.get("content") as string
    if (!content) return

    await serviceCreateAnnouncement(content)
    revalidatePath("/announcements")
}

export async function createCheckpointAction(formData: FormData) {
    const summary = formData.get("summary") as string
    const week_number = parseInt(formData.get("week_number") as string)
    // Scope is now determined by logic or default to 'team' if team_id is present
    let scope = formData.get("scope") as CheckpointScope
    const team_id = formData.get("team_id") as string | null

    if (team_id) {
        scope = "team"
    }

    // Fallback or custom logic if scope not set (though UI should handle standard cases)
    if (!scope) scope = "global"

    if (!summary || isNaN(week_number)) return

    await serviceCreateCheckpoint({
        summary,
        week_number,
        scope,
        team_id: team_id || undefined
    })
    revalidatePath("/checkpoints")
}

export async function saveSubscriptionAction(sub: any) {
    "use server"
    const supabase = await createClient()
    const user = await getMyProfile()
    if (!user) return

    // Parse the PushSubscriptionJSON
    const p256dh = sub.keys?.p256dh
    const auth = sub.keys?.auth

    if (!p256dh || !auth) return

    await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint: sub.endpoint,
        p256dh,
        auth
    }, { onConflict: 'endpoint' })
}

import { getMyProfile } from "@/lib/profile"
import { createClient } from "@/lib/supabase/server"
import { Role } from "@/types/user"

export async function updateUserRoleAction(userId: string, newRole: Role) {
    const supabase = await createClient()
    const currentUser = await getMyProfile()

    if (currentUser?.role !== "admin") {
        throw new Error("Unauthorized")
    }

    const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId)

    if (error) throw error

    revalidatePath("/admin")
}

import { updateFeedbackStatus } from "@/lib/feedback"

export async function updateFeedbackStatusAction(id: string, status: string) {
    await updateFeedbackStatus(id, status)
    revalidatePath("/feedback/inbox")
    revalidatePath("/feedback/my-feedback")
    // Also revalidate the specific thread pages
    revalidatePath(`/feedback/inbox/${id}`)
    revalidatePath(`/feedback/my-feedback/${id}`)
}

export async function updateUserProfileAction(userId: string, data: { role: Role; district_id: string; campus_id: string; email: string }) {
    const supabase = await createClient()
    const currentUser = await getMyProfile()

    if (!currentUser || !["admin", "campus_coordinator"].includes(currentUser.role)) {
        throw new Error("Unauthorized")
    }

    // Role-specific constraints
    if (currentUser.role === "campus_coordinator") {
        if (!currentUser.campus_id) throw new Error("Account not linked to a campus")

        // 1. Verify target user belongs to same campus
        const { data: targetUser } = await supabase.from("profiles").select("campus_id").eq("id", userId).single()
        if (!targetUser || targetUser.campus_id !== currentUser.campus_id) {
            throw new Error("You can only edit users from your campus")
        }

        // 2. Enforce scope
        data.campus_id = currentUser.campus_id
        data.district_id = currentUser.district_id

        // 3. Restrict role changes (Buddy/Participant only)
        if (data.role !== "buddy" && data.role !== "participant") {
            if (!["participant", "buddy"].includes(data.role)) {
                throw new Error("Campus Coordinators can only assign Participant or Buddy roles")
            }
        }
    }

    const { error } = await supabase
        .from("profiles")
        .update({
            role: data.role,
            district_id: data.district_id,
            campus_id: data.campus_id || null, // Handle empty string as null
            email: data.email
        })
        .eq("id", userId)

    if (error) throw error

    revalidatePath("/admin")
}

export async function resetPasswordAction(formData: FormData) {
    const email = String(formData.get("email")).trim()
    const supabase = await createClient()


    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/settings/password`,
    })

    if (error) {
        throw new Error(error.message)
    }
}

export async function updatePasswordAction(formData: FormData) {
    const password = String(formData.get("password")).trim()
    const confirmPassword = String(formData.get("confirmPassword")).trim()

    if (password !== confirmPassword) {
        throw new Error("Passwords do not match")
    }

    if (password.length < 6) {
        throw new Error("Password must be at least 6 characters")
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath("/profile")
}

import { createAdminClient } from "@/lib/supabase/admin"

export async function createUserAction(data: {
    email: string;
    full_name: string;
    password: string;
    role: Role;
    district_id: string;
    campus_id: string
}) {
    const currentUser = await getMyProfile()

    if (!currentUser || !["admin", "campus_coordinator"].includes(currentUser.role)) {
        throw new Error("Unauthorized")
    }

    // Role-specific constraints for Campus Coordinators
    if (currentUser.role === "campus_coordinator") {
        if (!currentUser.campus_id) throw new Error("Account not linked to a campus")

        // Enforce campus scope
        data.campus_id = currentUser.campus_id
        data.district_id = currentUser.district_id

        if (data.role !== "buddy") {
            throw new Error("Campus Coordinators can only add Buddies")
        }
    }

    const supabaseAdmin = createAdminClient()
    let userId: string | null = null;

    // 1. Create Supabase Auth User
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
            full_name: data.full_name
        }
    })

    if (authError) {
        // Handle case where auth user exists but profile might be missing
        if (authError.message.includes("already been registered")) {
            // Try to find the user via listUsers (Note: this only fetches the first 50 users by default)
            // Ideally Supabase Admin SDK should have getUserByEmail, but listUsers is the standard alternative.
            // We increase the limit to ensure we find them if possible (though effectively fetching all is better)
            const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })

            if (listError || !usersData) {
                console.error("Failed to list users:", listError)
                throw new Error("User exists but failed to retrieve details to update.")
            }

            const existingUser = usersData.users.find(u => u.email === data.email)

            if (existingUser) {
                userId = existingUser.id
                // Update credentials for existing user
                await supabaseAdmin.auth.admin.updateUserById(userId, {
                    password: data.password,
                    user_metadata: { full_name: data.full_name, email_confirm: true }
                })
            } else {
                throw new Error("User email is registered but could not be found in the user list (check if over 1000 users).")
            }
        } else {
            throw new Error(authError.message)
        }
    } else {
        userId = authUser.user?.id || null
    }

    if (!userId) throw new Error("Failed to resolve user ID")

    // 2. Create or Update Profile
    const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert({
            id: userId,
            full_name: data.full_name,
            role: data.role,
            district_id: data.district_id,
            campus_id: data.campus_id || null,
            email: data.email
        })

    if (profileError) throw new Error("Profile Error: " + profileError.message)

    revalidatePath("/admin")
}

import { postReply, toggleReaction } from "@/lib/feedback-thread"

export async function postFeedbackReplyAction(feedbackId: string, message: string) {
    if (!message.trim()) return
    await postReply(feedbackId, message)
    revalidatePath(`/feedback/inbox/${feedbackId}`)
    revalidatePath(`/feedback/my-feedback/${feedbackId}`)
}

export async function toggleFeedbackReactionAction(targetId: string, targetType: 'feedback' | 'reply', emoji: string) {
    await toggleReaction(targetId, targetType, emoji)
    revalidatePath("/feedback/inbox/[id]", 'page')
    revalidatePath("/feedback/my-feedback/[id]", 'page')
}

export async function getNotificationsAction() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

    return data || []
}

export async function markNotificationReadAction(id: string) {
    const supabase = await createClient()
    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)

    revalidatePath('/dashboard')
}

export async function markAllNotificationsReadAction() {
    const supabase = await createClient()
    const user = await getMyProfile()
    if (!user) return

    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

    revalidatePath('/dashboard')
}
