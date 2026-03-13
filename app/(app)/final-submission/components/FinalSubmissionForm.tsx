"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/components/ToastProvider"
import { submitFinalSubmission } from "@/actions/final-submission"
import { Check } from "lucide-react"
import confetti from "canvas-confetti"

type FinalSubmissionProfile = {
  fullName: string
  email: string | null
  districtName: string | null
  campusName: string | null
  teamName: string | null
  teamCode: string | null
}

type FinalSubmissionFormProps = {
  profile: FinalSubmissionProfile
  initialDriveLink: string
  submittedAt: string | null
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <input
        readOnly
        value={value}
        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
      />
    </div>
  )
}

export default function FinalSubmissionForm({ profile, initialDriveLink, submittedAt }: FinalSubmissionFormProps) {
  const [driveLink, setDriveLink] = useState(initialDriveLink)
  const [loading, setLoading] = useState(false)
  const [lastSubmittedAt, setLastSubmittedAt] = useState(submittedAt)
  const [hasSubmitted, setHasSubmitted] = useState(Boolean(submittedAt))
  const [acceptedConditions, setAcceptedConditions] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [tickAnimated, setTickAnimated] = useState(false)
  const { show } = useToast()

  const isTeamAssigned = Boolean(profile.teamName)
  const hasHtmlTag = (value: string) => /<[^>]*>/.test(value)

  useEffect(() => {
    if (!showSuccessModal) {
      setTickAnimated(false)
      return
    }

    confetti({
      particleCount: 120,
      spread: 80,
      startVelocity: 35,
      origin: { y: 0.6 },
    })

    const frame = requestAnimationFrame(() => setTickAnimated(true))
    return () => cancelAnimationFrame(frame)
  }, [showSuccessModal])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (loading) {
      return
    }

    if (!isTeamAssigned) {
      show({ title: "Team missing", description: "Please contact your coordinator to assign you to a team." })
      return
    }

    if (!driveLink.trim()) {
      show({ title: "Missing drive link", description: "Please add your final drive link before submitting." })
      return
    }

    if (hasHtmlTag(driveLink)) {
      show({ title: "Invalid link", description: "HTML tags are not allowed in the drive link." })
      return
    }

    if (!acceptedConditions) {
      show({ title: "Accept conditions", description: "Please accept the submission conditions before submitting." })
      return
    }

    setLoading(true)
    try {
      const result = await submitFinalSubmission({ driveLink })
      if (result.error) {
        show({ title: "Submission failed", description: result.error })
        return
      }

      const now = new Date().toISOString()
      setLastSubmittedAt(now)
      if (result.driveLink) {
        setDriveLink(result.driveLink)
      }
      setHasSubmitted(true)
      setShowSuccessModal(true)
      show({ title: "Submission saved", description: "Your final submission has been recorded." })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unexpected error"
      show({ title: "Error", description: message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {hasSubmitted ? (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="text-green-600" size={22} strokeWidth={3} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Final Submission Received</h2>
              <p className="text-sm text-slate-600 mt-1">Your response has been submitted successfully.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <ReadOnlyField label="Name" value={profile.fullName} />
            <ReadOnlyField label="Team Name" value={profile.teamName ?? "Not assigned"} />
            <ReadOnlyField label="Team Code" value={profile.teamCode ?? "Not assigned"} />
            <ReadOnlyField label="Submitted At" value={lastSubmittedAt ? new Date(lastSubmittedAt).toLocaleString() : "-"} />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Submitted Drive Link</p>
            <a
              href={driveLink}
              target="_blank"
              rel="noreferrer"
              className="text-brand-blue hover:underline break-all"
            >
              {driveLink}
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnlyField label="Name" value={profile.fullName} />
            <ReadOnlyField label="Team Name" value={profile.teamName ?? "Not assigned"} />
            <ReadOnlyField label="Team Code" value={profile.teamCode ?? "Not assigned"} />
            <ReadOnlyField label="Email" value={profile.email ?? "Not available"} />
            <ReadOnlyField label="Campus" value={profile.campusName ?? "Not available"} />
            <ReadOnlyField label="District" value={profile.districtName ?? "Not available"} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Final Drive Link</label>
            <input
              type="url"
              required
              pattern="https?://.*"
              maxLength={2048}
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
              disabled={!isTeamAssigned || loading}
            />
            <p className="text-xs text-slate-500 mt-2">
              Make sure this link is publicly visible and accessible.
            </p>
          </div>

          <div className={`rounded-xl border ${acceptedConditions ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"} p-4`}>
            <p className={`text-sm font-semibold ${acceptedConditions ? "text-green-900" : "text-amber-900"} mb-2`}>Submission Conditions</p>
            <ul className={`list-disc pl-5 text-sm ${acceptedConditions ? "text-green-800" : "text-amber-800"} space-y-1`}>
              <li>The drive link must be publicly visible.</li>
              <li>It must contain images or videos of your work, or a live website link.</li>
              <li>Best submissions will be <strong className="font-bold">featured</strong>.</li>
            </ul>
            <label className={`flex items-start gap-2 mt-3 text-sm ${acceptedConditions ? "text-green-900" : "text-amber-900"}`}>
              <input
                type="checkbox"
                checked={acceptedConditions}
                onChange={(e) => setAcceptedConditions(e.target.checked)}
                disabled={loading || !isTeamAssigned}
                className="mt-0.5"
              />
              <span className="">I confirm that my submission follows these conditions.</span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-slate-500">
              {lastSubmittedAt
                ? `Last submitted: ${new Date(lastSubmittedAt).toLocaleString()}`
                : "You have not submitted yet."}
            </p>

            <button
              type="submit"
              disabled={loading || !isTeamAssigned || !acceptedConditions}
              aria-busy={loading}
              className={`px-5 py-2.5 rounded-xl font-semibold text-white ${
                loading || !isTeamAssigned || !acceptedConditions
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-brand-blue hover:bg-blue-700"
              }`}
            >
              {loading ? "Saving..." : "Submit Final Link"}
            </button>
          </div>
        </form>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-center">
            <div className="mx-auto mb-4 relative h-16 w-16">
              <div className="absolute inset-0 rounded-full bg-green-100 animate-ping" />
              <div className="absolute inset-0 rounded-full bg-green-500 flex items-center justify-center">
                <Check
                  className={`text-white transition-all duration-300 ${
                    tickAnimated ? "scale-100 opacity-100" : "scale-50 opacity-0"
                  }`}
                  size={34}
                  strokeWidth={3}
                />
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Submission Successful</h3>
            <p className="text-sm text-slate-600 mt-1">
              Your final submission has been recorded.
            </p>
            <button
              type="button"
              className="mt-5 px-4 py-2 rounded-lg bg-brand-blue text-white font-semibold hover:bg-blue-700"
              onClick={() => setShowSuccessModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
