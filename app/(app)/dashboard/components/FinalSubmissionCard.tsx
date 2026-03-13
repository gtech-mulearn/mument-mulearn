import Link from "next/link"
import { Check, AlertOctagon } from "lucide-react"
import { Role } from "@/types/user"

type Props = {
  hasSubmitted: boolean
  submittedAt?: string | null
  role: Role
}

export default function FinalSubmissionCard({ hasSubmitted, submittedAt, role }: Props) {
  const isPrivileged = role === "admin" || role === "campus_coordinator"
  const ctaHref = isPrivileged ? "/final-submission" : "/final-submission"
  const ctaLabel = isPrivileged ? "View Submissions" : "Final Submission"

  return (
    <div className={`${hasSubmitted ? "bg-white" : "bg-red-600"} p-6 rounded-2xl border border-gray-100 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div className={`flex flex-col space-y-1 ${hasSubmitted ? "text-green-600" : "text-white"}`}>
          <h3 className="text-lg leading-tight font-semibold">Final Submission</h3>
          <p className="text-sm leading-relaxed">
            {isPrivileged
              ? "Track final responses from teams."
              : "Submit your final project link and get featured."}
          </p>
        </div>
        <div className={`flex items-center justify-center w-16 h-16 rounded-full ${hasSubmitted ? "bg-green-100" : "bg-gray-100"}`}>
          {hasSubmitted ? (
            <Check className="w-8 h-8 text-green-600" />
          ) : (
            <AlertOctagon className="w-8 h-8 text-red-600" />
          )}
        </div>
      </div>

      <div className="flex justify-between gap-6 mt-5 items-center">
        <p className={`text-sm leading-relaxed pr-2 ${hasSubmitted ? "text-green-600" : "text-white"}`}>
          {hasSubmitted
            ? `✓ ${isPrivileged ? "Submission tracker is available." : "You have completed final submission."}`
            : isPrivileged
              ? "No submissions to review yet."
              : "Final submission pending."}
          {!isPrivileged && hasSubmitted && submittedAt
            ? ` Submitted on ${new Date(submittedAt).toLocaleString("en-US", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
            : ""}
        </p>

        <Link href={ctaHref} className={`bg-slate-100 p-3 rounded-xl ${hasSubmitted ? "text-green-600" : "text-red-700"} font-medium`}>
          {ctaLabel}
        </Link>
      </div>
    </div>
  )
}
