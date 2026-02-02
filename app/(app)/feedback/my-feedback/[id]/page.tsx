
import { getFeedbackThread } from "@/lib/feedback-thread"
import { getMyProfile } from "@/lib/profile"
import { redirect, notFound } from "next/navigation"
import FeedbackThread from "../../components/FeedbackThread"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default async function FeedbackThreadPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const profile = await getMyProfile()
    if (!profile) redirect("/login")

    const thread = await getFeedbackThread(params.id)
    if (!thread) notFound()

    // Access Control: User must be creator
    if (thread.feedback.created_by.id !== profile.id) {
        notFound() // Or unauthorized
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-6">
            <Link href="/feedback/my-feedback" className="flex items-center text-sm text-slate-500 hover:text-slate-900 mb-6 w-fit">
                <ChevronLeft size={16} /> Back to My Feedback
            </Link>

            <FeedbackThread thread={thread} currentUserIds={profile.id} />
        </div>
    )
}
