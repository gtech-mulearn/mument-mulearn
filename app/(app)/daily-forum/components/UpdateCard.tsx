'use client';

import { Calendar, ArrowBigUpDash } from "lucide-react";

const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-pink-500', 'bg-yellow-500', 'bg-indigo-500'];

interface DailyUpdate {
    id: string;
    content: string;
    user_name?: string;
    college_name?: string;
    created_at?: string;
    upvote_count?: number;
    hasUpvoted?: boolean;
}

interface UpdateCardProps {
    update: DailyUpdate;
    index: number;
    upvoting: string | null;
    hasUpvoted: boolean;
    upvoteCount: number;
    onUpvote: (updateId: string) => void;
}

export default function UpdateCard({
    update,
    index,
    upvoting,
    hasUpvoted,
    upvoteCount,
    onUpvote
}: UpdateCardProps) {
    return (
        <div className="mb-4 border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 flex gap-4">
                <div className={`${colors[index % colors.length]} p-2 rounded-lg h-fit text-white shrink-0`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <Calendar size={14} className="inline-block mr-1 text-slate-400" />
                            <span className="text-sm text-slate-500">
                                {update.created_at ? new Date(update.created_at).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                    </div>
                    <p className="text-slate-800">{update.content}</p>
                </div>
            </div>
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                    <span className="font-medium">{update.user_name ?? 'Anonymous'}</span>
                    <span className="mx-2">•</span>
                    <span>{update.college_name ?? 'Updated in older version'}</span>
                </div>
                <button
                    onClick={() => onUpvote(update.id)}
                    disabled={upvoting === update.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        hasUpvoted
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-500'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    <ArrowBigUpDash size={16} />
                    <span className="text-sm font-medium">{upvoteCount}</span>
                </button>
            </div>
        </div>
    );
}
