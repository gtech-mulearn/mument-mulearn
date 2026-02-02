
"use client"

import { FeedbackView } from "@/lib/feedback"
import { User, Tag, MapPin, Mail, MessageCircle } from "lucide-react"
import Link from "next/link"
import FeedbackStatusSelect from "./FeedbackStatusSelect"
import ReactionButton from "../../components/ReactionButton"
import { toggleFeedbackReactionAction } from "@/actions"

export default function InboxFeedbackItem({ f, currentUserId }: { f: FeedbackView, currentUserId: string }) {

    const handleReaction = async (targetId: string, type: 'feedback' | 'reply', emoji: string) => {
        try {
            await toggleFeedbackReactionAction(targetId, type, emoji)
            // Expect revalidatePath to update UI
        } catch (error) {
            console.error("Reaction failed", error)
        }
    }

    return (
        <article className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                        {f.profiles?.full_name?.charAt(0) || <User size={18} />}
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors text-lg">
                            <Link href={`/feedback/inbox/${f.id}`}>
                                {f.subject}
                            </Link>
                        </h2>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            <span>{f.profiles?.full_name || "Unknown User"}</span>
                            <span>•</span>
                            <span>{new Date(f.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </div>
                <FeedbackStatusSelect id={f.id} currentStatus={f.status} />
            </div>

            <Link href={`/feedback/inbox/${f.id}`} className="block">
                <p className="text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                    {f.description}
                </p>
            </Link>

            <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-4 border-t border-slate-50 pt-4">
                <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    <Tag size={12} className="text-slate-400" />
                    <span className="font-medium text-slate-600">{f.category}</span>
                </div>
                {f.colleges?.name && (
                    <div className="flex items-center gap-1.5" title="Campus">
                        <MapPin size={14} className="text-slate-400" />
                        <span className="truncate max-w-[200px]">{f.colleges.name}</span>
                    </div>
                )}
                {f.profiles?.email && (
                    <div className="flex items-center gap-1.5" title="Email">
                        <Mail size={14} className="text-slate-400" />
                        <span>{f.profiles.email}</span>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-3 flex justify-between items-center border-t border-slate-50">
                <div onClick={(e) => e.stopPropagation()}>
                    <ReactionButton
                        targetId={f.id}
                        type="feedback"
                        reactions={f.reactions || []}
                        onReact={handleReaction}
                        currentUserId={currentUserId}
                        compact
                    />
                </div>

                <Link
                    href={`/feedback/inbox/${f.id}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                >
                    <MessageCircle size={16} />
                    Reply
                </Link>
            </div>
        </article>
    )
}
