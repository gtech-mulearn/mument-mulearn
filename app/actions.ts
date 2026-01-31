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
    revalidatePath("/feedback/my-feedback")
}

export async function updateUserProfileAction(userId: string, data: { role: Role; district_id: string; campus_id: string; email: string }) {
    const supabase = await createClient()
    const currentUser = await getMyProfile()

    if (currentUser?.role !== "admin") {
        throw new Error("Unauthorized")
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

    // Supabase will send a link that points to the configured site URL + /auth/callback?code=...
    // The callback route should exchange the code for a session and then redirect.
    // Here we suggest redirecting to a settings page where they can update the password.
    // If you haven't set up the callback route, you need to.

    // We assume there is a generic auth callback handler that handles this.
    // If not, we rely on the default behavior which usually just works if the site URL is correct.

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
    // Note: We don't need `createClient` for the auth part since we use `createAdminClient`,
    // but we check admin role first.
    const currentUser = await getMyProfile()

    if (currentUser?.role !== "admin") {
        throw new Error("Unauthorized")
    }

    const supabaseAdmin = createAdminClient()
    let userId: string | null = null;

    // 1. Try to Create Auth User
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
            full_name: data.full_name
        }
    })

    if (authError) {
        if (authError.message.includes("already been registered")) {
            // User exists, try to find them to repair the profile
            // We use listUsers. For very large projects this is inefficient, but okay here.
            const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
            // Naive find
            const existingUser = usersData.users.find(u => u.email === data.email)

            if (existingUser) {
                userId = existingUser.id
                // Update password and name for the existing user
                await supabaseAdmin.auth.admin.updateUserById(userId, {
                    password: data.password,
                    user_metadata: { full_name: data.full_name }
                })
            } else {
                throw new Error("User with this email exists but could not be located in directory.")
            }
        } else {
            throw new Error(authError.message)
        }
    } else {
        userId = authUser.user?.id || null
    }

    if (!userId) throw new Error("Failed to resolve user ID")

    // 2. Upsert Profile
    // Using upsert ensures that if the profile is missing (ghost user), it gets created.
    // If it exists, it gets updated.
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
