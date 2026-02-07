"use server"

import { createClient } from "@/lib/supabase/server"
import { getMyProfile } from "@/lib/profile"
import { revalidatePath } from "next/cache"

export type SettingsUpdateResult = {
    success: boolean
    error?: string
    data?: {
        id: string
        checkpoints_enabled: boolean
        updated_at: string
    }
}

export async function updateAdminSettings(
    checkpoints_enabled: boolean
): Promise<SettingsUpdateResult> {
    try {
        const supabase = await createClient()
        const user = await getMyProfile()

        // Check if user is admin
        if (!user || user.role !== "admin") {
            return {
                success: false,
                error: "Unauthorized - Admin access required"
            }
        }

        if (typeof checkpoints_enabled !== "boolean") {
            return {
                success: false,
                error: "Invalid checkpoints_enabled value"
            }
        }

        // Try to update existing settings
        const { data, error } = await supabase
            .from("admin_settings")
            .update({
                checkpoints_enabled,
                updated_at: new Date().toISOString(),
                updated_by: user.id
            })
            .eq("id", "global")
            .select()
            .single()

        if (error) {
            // If no existing record, insert a new one
            if (error.code === "PGRST116") {
                const { data: insertData, error: insertError } = await supabase
                    .from("admin_settings")
                    .insert({
                        id: "global",
                        checkpoints_enabled,
                        updated_at: new Date().toISOString(),
                        updated_by: user.id
                    })
                    .select()
                    .single()

                if (insertError) {
                    return {
                        success: false,
                        error: "Failed to create settings"
                    }
                }

                revalidatePath("/admin/settings")
                return {
                    success: true,
                    data: {
                        id: insertData.id,
                        checkpoints_enabled: insertData.checkpoints_enabled,
                        updated_at: insertData.updated_at
                    }
                }
            }

            return {
                success: false,
                error: "Failed to update settings"
            }
        }

        revalidatePath("/admin/settings")
        return {
            success: true,
            data: {
                id: data.id,
                checkpoints_enabled: data.checkpoints_enabled,
                updated_at: data.updated_at
            }
        }
    } catch (error) {
        console.error("Error updating admin settings:", error)
        return {
            success: false,
            error: "An error occurred while updating settings"
        }
    }
}
