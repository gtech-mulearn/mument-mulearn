"use client"

import { useState } from "react"
import { Calendar, CheckCircle, ChevronDown, ChevronUp, XCircle } from "lucide-react"

type CheckpointRecord = {
	id: string
	created_at: string
	checkpoint_number: number
	is_absent: boolean
	meeting_medium?: string | null
	camera_on?: boolean | null
	team_introduced?: boolean | null
	idea_summary?: string | null
	last_week_progress?: string | null
	next_week_target?: string | null
	needs_support?: boolean | null
	support_details?: string | null
	suggestions?: string | null
	buddy_name?: string | null
	team_name?: string | null
	teams?: { team_name?: string | null } | null
}

export default function CheckpointExpanded({ checkpoint }: { checkpoint: CheckpointRecord }) {
	const [isExpanded, setIsExpanded] = useState(false)

	const teamName = checkpoint.team_name || checkpoint.teams?.team_name || "Unknown Team"

	return (
		<article className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
			<button
				type="button"
				onClick={() => setIsExpanded(prev => !prev)}
				className="w-full text-left p-5"
				aria-expanded={isExpanded}
			>
				<div className="flex items-start justify-between mb-3">
					<div className="flex gap-2">
						{checkpoint.is_absent ? (
							<span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
								<XCircle size={12} />
								Absent
							</span>
						) : (
							<span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
								<CheckCircle size={12} />
								Present
							</span>
						)}
					</div>
					<span className="text-xs text-slate-400 font-mono">CP{checkpoint.checkpoint_number}</span>
				</div>

				<div className="mb-3">
					<h2 className="text-lg font-bold text-slate-800">
						{teamName} - Checkpoint {checkpoint.checkpoint_number}
					</h2>
				</div>

				{checkpoint.is_absent ? (
					<p className="text-sm text-slate-500 mb-4 italic">Team was marked absent</p>
				) : (
					<div className="space-y-2 mb-4 text-sm text-slate-600">
						{checkpoint.idea_summary && (
							<div>
								<p className="font-medium text-slate-700">Idea:</p>
								<p className="text-xs leading-relaxed">
									{checkpoint.idea_summary.substring(0, 100)}
									{checkpoint.idea_summary.length > 100 ? "..." : ""}
								</p>
							</div>
						)}
						{checkpoint.meeting_medium && (
							<p><span className="font-medium">Meeting:</span> <span className="capitalize">{checkpoint.meeting_medium.replace("_", " ")}</span></p>
						)}
						{checkpoint.camera_on !== null && checkpoint.camera_on !== undefined && (
							<p><span className="font-medium">Camera:</span> {checkpoint.camera_on ? "On" : "Off"}</p>
						)}
					</div>
				)}

				<div className="flex items-center justify-between text-xs text-slate-400 border-t border-gray-50 pt-3">
					<div className="flex items-center gap-1">
						<Calendar size={14} />
						<span>{new Date(checkpoint.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
					</div>
					<span className="text-slate-500 font-medium">Week {checkpoint.checkpoint_number}</span>
				</div>

				<div className="mt-3 flex items-center justify-between text-xs text-slate-500">
					<span>{isExpanded ? "Hide details" : "View details"}</span>
					{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
				</div>
			</button>

			{isExpanded && !checkpoint.is_absent && (
				<div className="px-5 pb-5 pt-0 text-sm text-slate-700 space-y-3">
					{checkpoint.team_introduced !== null && checkpoint.team_introduced !== undefined && (
						<p><span className="font-medium">Introduced:</span> {checkpoint.team_introduced ? "Yes" : "No"}</p>
					)}
					{checkpoint.last_week_progress && (
						<div>
							<p className="font-medium">Last week progress:</p>
							<p className="text-xs leading-relaxed">{checkpoint.last_week_progress}</p>
						</div>
					)}
					{checkpoint.next_week_target && (
						<div>
							<p className="font-medium">Next week target:</p>
							<p className="text-xs leading-relaxed">{checkpoint.next_week_target}</p>
						</div>
					)}
					{checkpoint.needs_support !== null && checkpoint.needs_support !== undefined && (
						<p><span className="font-medium">Needs support:</span> {checkpoint.needs_support ? "Yes" : "No"}</p>
					)}
					{checkpoint.support_details && (
						<div>
							<p className="font-medium">Support details:</p>
							<p className="text-xs leading-relaxed">{checkpoint.support_details}</p>
						</div>
					)}
					{checkpoint.suggestions && (
						<div>
							<p className="font-medium">Suggestions:</p>
							<p className="text-xs leading-relaxed">{checkpoint.suggestions}</p>
						</div>
					)}
					{checkpoint.buddy_name && (
						<p><span className="font-medium">Verified by:</span> {checkpoint.buddy_name}</p>
					)}
				</div>
			)}
		</article>
	)
}
