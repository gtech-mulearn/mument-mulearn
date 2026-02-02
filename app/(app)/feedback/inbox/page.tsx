import { getFeedbackInbox } from "@/lib/feedback"
import { Inbox, User, Tag, MapPin, Mail, MessageCircle } from "lucide-react"
import Link from "next/link"
import FeedbackStatusSelect from "./components/FeedbackStatusSelect"
import FeedbackFilter from "./components/FeedbackFilter"

export const dynamic = "force-dynamic"

export default async function FeedbackInboxPage(props: { searchParams: Promise<{ status?: string }> }) {
    const searchParams = await props.searchParams;
    const feedback = await getFeedbackInbox(searchParams.status)

    return (
        <div className="py-8 px-6 max-w-5xl mx-auto">
            <header className="mb-6 border-b border-gray-100 pb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Feedback Inbox</h1>
                    <p className="text-sm text-slate-500">Manage and review submitted feedback</p>
                </div>
                <FeedbackFilter />
            </header>

            {feedback.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Inbox className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No feedback items found</p>
                    <p className="text-gray-400 text-sm">New submissions will appear here</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {feedback.map((f) => (
                        <article key={f.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">

                            {/* Header: Status, Category, Date */}
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <FeedbackStatusSelect id={f.id} currentStatus={f.status} />
                                    </div>
                                    <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-50 rounded-full border border-slate-100 flex items-center gap-1">
                                        <Tag size={10} /> {f.category}
                                    </span>
                                </div>
                                <span className="text-xs text-slate-400 font-medium">
                                    {new Date(f.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {/* Content */}
                            <Link href={`/feedback/inbox/${f.id}`} className="block mb-4 group">
                                <h3 className="font-semibold text-slate-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">{f.subject}</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">{f.description}</p>
                            </Link>

                            {/* Footer: User Details */}
                            <div className="pt-4 border-t border-gray-50 flex flex-wrap gap-4 text-xs text-slate-500">
                                <div className="flex items-center gap-1.5" title="Submitted by">
                                    <User size={14} className="text-slate-400" />
                                    <span className="font-medium text-slate-700">{f.profiles?.full_name || "Unknown User"}</span>
                                </div>

                                {f.colleges?.name && (
                                    <div className="flex items-center gap-1.5 align-middle" title="Campus">
                                        <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                                        <MapPin size={14} className="text-slate-400" />
                                        <span className="truncate max-w-[200px]">{f.colleges.name}</span>
                                    </div>
                                )}

                                {f.profiles?.email && (
                                    <div className="flex items-center gap-1.5 align-middle" title="Email">
                                        <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                                        <Mail size={14} className="text-slate-400" />
                                        <span>{f.profiles.email}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-3 flex justify-end border-t border-slate-50">
                                <Link
                                    href={`/feedback/inbox/${f.id}`}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                                >
                                    <MessageCircle size={16} />
                                    Reply to Thread
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    )
}