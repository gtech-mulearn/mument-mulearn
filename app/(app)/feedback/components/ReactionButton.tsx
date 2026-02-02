
"use client"

import { useState } from "react"
import { Smile } from "lucide-react"

interface ReactionButtonProps {
    targetId: string
    type: 'feedback' | 'reply'
    reactions: any[]
    onReact: (targetId: string, type: 'feedback' | 'reply', emoji: string) => void
    currentUserId: string
    compact?: boolean
}

export default function ReactionButton({ targetId, type, reactions, onReact, currentUserId, compact }: ReactionButtonProps) {
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
        <div className="flex gap-1 items-center relative z-10">
            {Object.entries(counts).map(([emoji, count]) => (
                <button
                    key={emoji}
                    onClick={(e) => {
                        e.preventDefault()
                        handleReact(emoji)
                    }}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors border ${myReactions[emoji] ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                    <span>{emoji}</span>
                    <span className="font-medium">{count}</span>
                </button>
            ))}

            <div className="relative">
                <button
                    onClick={(e) => {
                        e.preventDefault()
                        setIsOpen(!isOpen)
                    }}
                    className={`p-1 rounded-full text-slate-400 hover:bg-slate-100 transition-colors ${compact ? 'h-6 w-6' : 'h-8 w-8'} flex items-center justify-center`}
                >
                    <Smile size={compact ? 14 : 16} />
                </button>

                {isOpen && (
                    <>
                        {/* Backdrop to close */}
                        <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setIsOpen(false)
                        }} />

                        {/* Popover */}
                        <div className="absolute bottom-full left-0 mb-2 bg-white shadow-xl border border-slate-100 rounded-lg p-2 gap-1 flex z-50 animate-in fade-in zoom-in-95 duration-100 min-w-max" onClick={(e) => e.preventDefault()}>
                            {emojis.map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handleReact(emoji)
                                    }}
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
