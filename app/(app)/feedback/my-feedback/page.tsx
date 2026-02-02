import { getMyFeedback } from "@/lib/feedback"
import { Tag, Clock, CheckCircle2, AlertCircle, XCircle, Inbox } from "lucide-react"
import Link from "next/link"

export default async function MyFeedbackPage() {
    const feedback = await getMyFeedback()

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100"><CheckCircle2 size={12} /> Completed</span>
            case 'closed':
                return <span className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200"><XCircle size={12} /> Closed</span>
            case 'work_in_progress':
                return <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100"><Clock size={12} /> In Progress</span>
            default:
                return <span className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100"><AlertCircle size={12} /> Submitted</span>
        }
    }

    return (
        <div className="py-8 px-6 max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">My Feedback</h1>
                <p className="text-slate-500 text-sm mt-1">Track the status of your submissions</p>
            </header>

            {feedback.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    <Inbox className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-slate-600 font-medium">You haven't submitted any feedback yet</p>
                    <p className="text-slate-400 text-sm mt-1">Found an issue or have an idea? Submit one now.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {feedback.map((f) => (
                        <Link href={`/feedback/my-feedback/${f.id}`} key={f.id} className="block group">
                            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group-hover:border-blue-200">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{f.subject}</h3>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                                <Tag size={10} /> {f.category}
                                            </span>
                                            <span className="text-slate-300 text-[10px]">•</span>
                                            <span className="text-xs text-slate-400">
                                                {new Date(f.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        {getStatusBadge(f.status || 'new')}
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 bg-slate-50/50 p-3 rounded-lg border border-slate-50/50 line-clamp-2">
                                    {f.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
