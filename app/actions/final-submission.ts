"use server"

import { revalidatePath } from "next/cache"
import { getMyProfile } from "@/lib/profile"
import { createClient } from "@/lib/supabase/server"

export async function submitFinalSubmission(input: { driveLink: string }) {
  const rawDriveLink = input.driveLink?.trim()

  if (!rawDriveLink) {
    return { error: "Drive link is required." }
  }

  if (/<[^>]*>/.test(rawDriveLink)) {
    return { error: "HTML tags are not allowed in the drive link." }
  }

  let driveLink: string
  try {
    const parsedUrl = new URL(rawDriveLink)
    if (!/^https?:$/.test(parsedUrl.protocol)) {
      return { error: "Please provide a valid http(s) link." }
    }
    driveLink = parsedUrl.toString()
  } catch {
    return { error: "Please provide a valid URL." }
  }

  const profile = await getMyProfile()
  if (!profile) {
    return { error: "You must be logged in to submit." }
  }

  if (!profile.team_id || !profile.team_name) {
    return { error: "You must be assigned to a team before submitting." }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("final_submissions")
    .upsert(
      {
        user_id: profile.id,
        team_id: profile.team_id,
        team_name: profile.team_name,
        team_code: profile.team_code ?? null,
        full_name: profile.full_name,
        email: profile.email,
        campus_id: profile.campus_id,
        campus_name: profile.campus_name ?? null,
        district_id: profile.district_id,
        district_name: profile.district_name ?? null,
        role: profile.role,
        drive_link: driveLink,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

  if (error) {
    console.error("[submitFinalSubmission] Failed:", error)
    return { error: "Unable to submit now. Please try again." }
  }

  revalidatePath("/final-submission")
  return { success: true, driveLink }
}
