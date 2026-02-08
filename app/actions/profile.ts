'use server'

import { createClient } from "@/lib/supabase/server"

export async function updateProfile(updates: {
  full_name?: string
  profile_image_url?: string
  bio?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)

  if (error) throw error

  return { success: true }
}
