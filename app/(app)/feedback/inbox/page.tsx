import { getFeedbackInbox, getFeedbackStats } from "@/lib/feedback"
import { getMyProfile } from "@/lib/profile"
import FeedbackTabs from "./components/FeedbackTabs"
import Pagination from "./components/Pagination"
import InboxFeedbackItem from "./components/InboxFeedbackItem"
import FeedbackSort from "./components/FeedbackSort"
import { Inbox } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function FeedbackInboxPage(props: { searchParams: Promise<{ status?: string, page?: string, sort?: string }> }) {
    const searchParams = await props.searchParams;
    const page = Number(searchParams.page) || 1
    const limit = 10
    const sort = searchParams.sort || 'newest'

    // Fetch data and stats
    const { data: feedback, total } = await getFeedbackInbox(searchParams.status, page, limit, sort)
    const stats = await getFeedbackStats()
    const user = await getMyProfile()

    if (!user) return null

    return (
        <div className="py-8 px-6 max-w-5xl mx-auto">
            <header className="mb-6">
                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Feedback Inbox</h1>
                        <p className="text-sm text-slate-500">Manage and review submitted feedback</p>
                    </div>
                    <FeedbackSort />
                </div>
                <FeedbackTabs counts={stats} />
            </header>

            {feedback.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                    <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Inbox className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-medium text-lg">No feedback found</p>
                    <p className="text-slate-400 mt-1">Try adjusting your filters</p>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {feedback.map((f) => (
                            <InboxFeedbackItem key={f.id} f={f} currentUserId={user.id} />
                        ))}
                    </div>

                    <Pagination total={total} limit={limit} />
                </>
            )}
        </div>
    )
}