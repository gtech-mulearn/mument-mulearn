import { getMyProfile } from "@/lib/profile"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import FinalSubmissionForm from "./components/FinalSubmissionForm"
import { Check, Search } from "lucide-react"
import SubmissionSearchTools from "./components/SubmissionSearchTools"

export default async function FinalSubmissionPage() {
  const profile = await getMyProfile()

  if (!profile) {
    return null
  }

  if (["admin", "campus_coordinator"].includes(profile.role)) {
    if (profile.role === "campus_coordinator" && !profile.campus_id) {
      return (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-brand-blue">Final Submissions</h1>
          <p className="text-sm text-red-600 mt-4">Campus coordinator account is missing campus assignment.</p>
        </div>
      )
    }

    const adminSupabase = createAdminClient()
    let submissionsQuery = adminSupabase
      .from("final_submissions")
      .select("id, full_name, email, team_name, team_code, campus_name, district_name, drive_link, submitted_at")
      .order("submitted_at", { ascending: false })

    if (profile.role === "campus_coordinator" && profile.campus_id) {
      submissionsQuery = submissionsQuery.eq("campus_id", profile.campus_id)
    }

    const { data: submissions, error } = await submissionsQuery

    if (error) {
      return (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-brand-blue">Final Submissions</h1>
          <p className="text-sm text-red-600 mt-4">Failed to load submissions.</p>
        </div>
      )
    }

    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand-blue">Final Submissions</h1>
          <p className="text-sm text-slate-600 mt-1">
            {profile.role === "admin"
              ? "Viewing all final submissions."
              : "Viewing final submissions from your campus."}
          </p>
        </div>

        <SubmissionSearchTools
          submissions={submissions ?? []}
          showCampusFilter={profile.role === "admin"}
          showDistrictFilter={profile.role === "admin"}
        />
      </div>
    )
  }

  const supabase = await createClient()
  const { data: existingSubmission } = await supabase
    .from("final_submissions")
    .select("drive_link, submitted_at")
    .eq("user_id", profile.id)
    .maybeSingle()

  const hasSubmitted = Boolean(existingSubmission)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-blue">Final Submission</h1>
        <p className="text-sm text-slate-600 mt-1">
          Submit your final drive link. It&apos;s your key to the new verse!
        </p>
      </div>

      {hasSubmitted ? (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="text-green-600" size={22} strokeWidth={3} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Final Submission Received</h2>
              <p className="text-sm text-slate-600 mt-1">You have already submitted your final response.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-xs text-slate-500 mb-1">Submitted At</p>
              <p className="text-sm font-medium text-slate-800">
                {existingSubmission?.submitted_at
                  ? new Date(existingSubmission.submitted_at).toLocaleString()
                  : "-"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">Submitted Drive Link</p>
            <a
              href={existingSubmission?.drive_link ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="text-brand-blue hover:underline break-all"
            >
              {existingSubmission?.drive_link}
            </a>
          </div>
        </div>
      ) : (
        <FinalSubmissionForm
          profile={{
            fullName: profile.full_name,
            email: profile.email,
            districtName: profile.district_name ?? null,
            campusName: profile.campus_name ?? null,
            teamName: profile.team_name ?? null,
            teamCode: profile.team_code ?? null,
          }}
          initialDriveLink={existingSubmission?.drive_link ?? ""}
          submittedAt={existingSubmission?.submitted_at ?? null}
        />
      )}
    </div>
  )
}
