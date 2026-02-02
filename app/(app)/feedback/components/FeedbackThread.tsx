
"use client"

import { useState } from "react"
import { FeedbackThread as IFeedbackThread } from "@/lib/feedback-thread"
import { postFeedbackReplyAction, toggleFeedbackReactionAction } from "@/actions"
import { useToast } from "@/components/ToastProvider"
import { Send, ThumbsUp, Heart, Smile } from "lucide-react"

interface FeedbackThreadProps {
    thread: IFeedbackThread
    currentUserIds: string
}

export default function FeedbackThread({ thread, currentUserIds }: FeedbackThreadProps) {
    const { show } = useToast()
    const [reply, setReply] = useState("")
    const [sending, setSending] = useState(false)

    // Optimistic UI updates could be added here, but for now we rely on revalidatePath

    async function handleSend() {
        if (!reply.trim()) return
        setSending(true)
        try {
            await postFeedbackReplyAction(thread.feedback.id, reply)
            setReply("")
        } catch (error) {
            show({ title: "Error", description: "Failed to post reply" })
        } finally {
            setSending(false)
        }
    }

    async function handleReaction(targetId: string, type: 'feedback' | 'reply', emoji: string) {
        try {
            await toggleFeedbackReactionAction(targetId, type, emoji)
        } catch (error) {
            // silent fail or toast
        }
    }

    return (
        <div className="space-y-6">
            {/* Thread Container */}
            <div className="space-y-4">

                {/* 1. Original Post */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                {thread.feedback.created_by.full_name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">{thread.feedback.created_by.full_name}</h3>
                                <p className="text-xs text-slate-500">{new Date(thread.feedback.created_at).toLocaleString()}</p>
                            </div>
                        </div>
                        <span className="px-2 py-1 bg-slate-100 text-xs rounded text-slate-600 font-medium uppercase">
                            {thread.feedback.status}
                        </span>
                    </div>

                    <div className="mt-4">
                        <h2 className="text-xl font-bold text-slate-800">{thread.feedback.subject}</h2>
                        <p className="mt-2 text-slate-600 whitespace-pre-wrap">{thread.feedback.description}</p>
                    </div>

                    <div className="mt-4 flex gap-2">
                        {/* Reactions for Main Post */}
                        <ReactionButton
                            targetId={thread.feedback.id}
                            type="feedback"
                            reactions={thread.reactions.filter(r => r.target_id === thread.feedback.id)}
                            onReact={handleReaction}
                            currentUserId={currentUserIds}
                        />
                    </div>
                </div>

                {/* 2. Replies List */}
                {thread.replies.map((reply) => (
                    <div key={reply.id} className={`flex gap-3 ${reply.is_admin_reply ? 'flex-row-reverse' : ''}`}>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${reply.is_admin_reply ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
                            {reply.user.full_name.charAt(0)}
                        </div>

                        <div className={`max-w-[80%] rounded-2xl p-4 ${reply.is_admin_reply ? 'bg-indigo-50 text-slate-800 rounded-tr-none' : 'bg-white border border-slate-100 shadow-sm rounded-tl-none'}`}>
                            <div className={`flex items-center gap-2 mb-1 ${reply.is_admin_reply ? 'justify-end' : ''}`}>
                                <span className="font-semibold text-sm">{reply.user.full_name}</span>
                                {reply.is_admin_reply && <span className="text-[10px] bg-indigo-200 text-indigo-800 px-1 rounded">ADMIN</span>}
                                <span className="text-xs text-slate-400">{new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{reply.message}</p>

                            <div className={`mt-2 flex ${reply.is_admin_reply ? 'justify-end' : ''}`}>
                                <ReactionButton
                                    targetId={reply.id}
                                    type="reply"
                                    reactions={thread.reactions.filter(r => r.target_id === reply.id)}
                                    onReact={handleReaction}
                                    currentUserId={currentUserIds}
                                    compact
                                />
                            </div>
                        </div>
                    </div>
                ))}

            </div>

            {/* 3. Reply Input */}
            <div className="bg-white border-t border-slate-200 p-4 mt-8 rounded-xl shadow-sm">
                <div className="flex gap-2">
                    <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none text-sm h-12 min-h-[48px] max-h-32 transition-all focus:h-24"
                    />
                    <button
                        onClick={handleSend}
                        disabled={sending || !reply.trim()}
                        className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-12 w-12 flex items-center justify-center"
                    >
                        {sending ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Send size={18} />}
                    </button>
                </div>
            </div>
        </div>
    )
}

function ReactionButton({ targetId, type, reactions, onReact, currentUserId, compact }: any) {
    const emojis = ['👍', '❤️', '🎉', '😂', '😮', '😢']
    const [isOpen, setIsOpen] = useState(false)

    // Group reactions by emoji
    const counts: Record<string, number> = {}
    const myReactions: Record<string, boolean> = {}

    reactions.forEach((r: any) => {
        counts[r.emoji] = (counts[r.emoji] || 0) + 1
        if (r.user_id === currentUserId) myReactions[r.emoji] = true
    })

    const handleReact = (emoji: string) => {
        onReact(targetId, type, emoji)
        setIsOpen(false)
    }

    return (
        <div className="flex gap-1 items-center relative">
            {Object.entries(counts).map(([emoji, count]) => (
                <button
                    key={emoji}
                    onClick={() => handleReact(emoji)} // Toggle off if clicked? Logic handled in backend toggle
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors border ${myReactions[emoji] ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                    <span>{emoji}</span>
                    <span className="font-medium">{count}</span>
                </button>
            ))}

            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`p-1 rounded-full text-slate-400 hover:bg-slate-100 transition-colors ${compact ? 'h-6 w-6' : 'h-8 w-8'} flex items-center justify-center`}
                >
                    <Smile size={compact ? 14 : 16} />
                </button>

                {isOpen && (
                    <>
                        {/* Backdrop to close */}
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

                        {/* Popover */}
                        <div className="absolute bottom-full left-0 mb-2 bg-white shadow-xl border border-slate-100 rounded-lg p-2 gap-1 flex z-50 animate-in fade-in zoom-in-95 duration-100 min-w-max">
                            {emojis.map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => handleReact(emoji)}
                                    className={`p-2 hover:bg-slate-50 rounded-md transition-colors text-xl leading-none ${myReactions[emoji] ? 'bg-blue-50/50 ring-1 ring-blue-100' : ''}`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
