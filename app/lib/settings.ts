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
        allowed_checkpoint_number: number
        updated_at: string
    }
}

export async function updateAdminSettings(
    checkpoints_enabled: boolean,
    allowed_checkpoint_number?: number,
    buddies_enabled?: boolean
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

        // Build update object
        const updateData: any = {
            checkpoints_enabled,
            updated_at: new Date().toISOString(),
            updated_by: user.id
        }

        // Include allowed_checkpoint_number if provided
        if (allowed_checkpoint_number !== undefined) {
            if (typeof allowed_checkpoint_number !== "number" || allowed_checkpoint_number < 1 || allowed_checkpoint_number > 4) {
                return {
                    success: false,
                    error: "Invalid checkpoint number. Must be between 1 and 4"
                }
            }
            updateData.allowed_checkpoint_number = allowed_checkpoint_number
        }

        // Only include buddies_enabled if provided
        if (buddies_enabled !== undefined && typeof buddies_enabled === "boolean") {
            updateData.buddies_enabled = buddies_enabled
        }

        // Try to update existing settings
        const { data, error } = await supabase
            .from("admin_settings")
            .update(updateData)
            .eq("id", "global")
            .select()
            .single()

        if (error) {
            // If no existing record, insert a new one
            if (error.code === "PGRST116") {
                const insertData: any = {
                    id: "global",
                    checkpoints_enabled,
                    allowed_checkpoint_number: allowed_checkpoint_number ?? 2,
                    updated_at: new Date().toISOString(),
                    updated_by: user.id
                }

                // Include buddies_enabled if provided
                if (buddies_enabled !== undefined) {
                    insertData.buddies_enabled = buddies_enabled
                } else {
                    insertData.buddies_enabled = true
                }

                const { data: insertedData, error: insertError } = await supabase
                    .from("admin_settings")
                    .insert(insertData)
                    .select()
                    .single()

                if (insertError) {
                    return {
                        success: false,
                        error: "Failed to create settings"
                    }
                }

                revalidatePath("/admin/settings")
                revalidatePath("/checkpoints")
                return {
                    success: true,
                    data: {
                        id: insertedData.id,
                        checkpoints_enabled: insertedData.checkpoints_enabled,
                        allowed_checkpoint_number: insertedData.allowed_checkpoint_number,
                        updated_at: insertedData.updated_at
                    }
                }
            }

            return {
                success: false,
                error: "Failed to update settings"
            }
        }

        revalidatePath("/admin/settings")
        revalidatePath("/checkpoints")
        return {
            success: true,
            data: {
                id: data.id,
                checkpoints_enabled: data.checkpoints_enabled,
                allowed_checkpoint_number: data.allowed_checkpoint_number,
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
