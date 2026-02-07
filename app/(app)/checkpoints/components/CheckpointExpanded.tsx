"use client"

import { useState } from "react"
import { Calendar, CheckCircle, X, XCircle, Trash2, Edit2 } from "lucide-react"
import { deleteCheckpointAction, updateCheckpointAction } from "@/actions"
import { useToast } from "@/components/ToastProvider"

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
	const [isOpen, setIsOpen] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [editForm, setEditForm] = useState({
		is_absent: checkpoint.is_absent,
		meeting_medium: checkpoint.meeting_medium || "",
		camera_on: checkpoint.camera_on ?? false,
		team_introduced: checkpoint.team_introduced ?? false,
		idea_summary: checkpoint.idea_summary || "",
		last_week_progress: checkpoint.last_week_progress || "",
		next_week_target: checkpoint.next_week_target || "",
		needs_support: checkpoint.needs_support ?? false,
		support_details: checkpoint.support_details || "",
		suggestions: checkpoint.suggestions || ""
	})
	const { show: showToast } = useToast()

	const teamName = checkpoint.team_name || checkpoint.teams?.team_name || "Unknown Team"

	const handleDelete = async () => {
		setIsDeleting(true)
		try {
			await deleteCheckpointAction(checkpoint.id)
			showToast({
				title: "Success",
				description: "Checkpoint deleted successfully"
			})
			// Close confirmation dialog first
			setShowDeleteConfirm(false)
			// Then close modal after a brief delay to show success toast
			setTimeout(() => setIsOpen(false), 500)
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : "Failed to delete checkpoint"
			console.error("[CheckpointExpanded] Delete error:", error)
			showToast({
				title: "Error",
				description: errorMessage
			})
		} finally {
			setIsDeleting(false)
			setShowDeleteConfirm(false)
		}
	}

	const handleEditStart = () => {
		setIsEditing(true)
	}

	const handleEditCancel = () => {
		setIsEditing(false)
		setEditForm({
			is_absent: checkpoint.is_absent,
			meeting_medium: checkpoint.meeting_medium || "",
			camera_on: checkpoint.camera_on ?? false,
			team_introduced: checkpoint.team_introduced ?? false,
			idea_summary: checkpoint.idea_summary || "",
			last_week_progress: checkpoint.last_week_progress || "",
			next_week_target: checkpoint.next_week_target || "",
			needs_support: checkpoint.needs_support ?? false,
			support_details: checkpoint.support_details || "",
			suggestions: checkpoint.suggestions || ""
		})
	}

	const handleSaveEdit = async () => {
		setIsSaving(true)
		try {
			await updateCheckpointAction(checkpoint.id, {
				is_absent: editForm.is_absent,
				meeting_medium: editForm.is_absent ? null : editForm.meeting_medium || null,
				camera_on: editForm.is_absent ? null : editForm.camera_on,
				team_introduced: editForm.is_absent ? null : editForm.team_introduced,
				idea_summary: editForm.is_absent ? null : editForm.idea_summary || null,
				last_week_progress: editForm.is_absent ? null : editForm.last_week_progress || null,
				next_week_target: editForm.is_absent ? null : editForm.next_week_target || null,
				needs_support: editForm.is_absent ? null : editForm.needs_support,
				support_details: editForm.is_absent ? null : editForm.support_details || null,
				suggestions: editForm.is_absent ? null : editForm.suggestions || null
			})
			showToast({
				title: "Success",
				description: "Checkpoint updated successfully"
			})
			setIsEditing(false)
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : "Failed to update checkpoint"
			console.error("[CheckpointExpanded] Update error:", error)
			showToast({
				title: "Error",
				description: errorMessage
			})
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<>
			<article
				onClick={() => setIsOpen(true)}
				className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all cursor-pointer"
			>
				<div className="p-5">
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

					<div className="mt-3 text-xs text-slate-500">
						<span>Click to view full details</span>
					</div>
				</div>
			</article>

			{isOpen && (
				<div className="fixed inset-0 bg-black/60 z-50 flex items-center backdrop-blur-sm justify-center p-4" onClick={() => setIsOpen(false)}>
					<div
						className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-start justify-between">
							<div>
								<h2 className="text-2xl font-bold text-slate-800">
									{teamName} - Checkpoint {checkpoint.checkpoint_number}
								</h2>
								<p className="text-xs text-slate-400 mt-1">
									{new Date(checkpoint.created_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
								</p>
							</div>
							<div className="flex gap-2">
								<button
									onClick={() => handleEditStart()}
									className="text-slate-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-lg"
									aria-label="Edit"
									disabled={isEditing}
								>
									<Edit2 size={20} />
								</button>
								<button
									onClick={() => setShowDeleteConfirm(true)}
									className="text-slate-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
									aria-label="Delete"
									disabled={isDeleting}
								>
									<Trash2 size={20} />
								</button>
								<button
									onClick={() => setIsOpen(false)}
									className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-lg"
									aria-label="Close"
								>
									<X size={24} />
								</button>
							</div>
						</div>

						<div className="p-6 space-y-4 text-sm text-slate-700">
							{isEditing ? (
								<div className="space-y-4">
									<div>
										<label className="font-semibold text-slate-800 block mb-2">Status</label>
										<div className="flex gap-4">
											<label className="flex items-center gap-2 cursor-pointer">
												<input
													type="radio"
													name="status"
													checked={!editForm.is_absent}
													onChange={() => setEditForm({ ...editForm, is_absent: false })}
													disabled={isSaving}
												/>
												<span>Present</span>
											</label>
											<label className="flex items-center gap-2 cursor-pointer">
												<input
													type="radio"
													name="status"
													checked={editForm.is_absent}
													onChange={() => setEditForm({ ...editForm, is_absent: true })}
													disabled={isSaving}
												/>
												<span>Absent</span>
											</label>
										</div>
									</div>

									{!editForm.is_absent && (
										<>
											<div>
												<label className="font-semibold text-slate-800 block mb-2">Meeting Medium</label>
												<select
													value={editForm.meeting_medium}
													onChange={(e) => setEditForm({ ...editForm, meeting_medium: e.target.value })}
													disabled={isSaving}
													className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
												>
													<option value="">Select meeting medium</option>
													<option value="google_meet">Google Meet</option>
													<option value="zoom">Zoom</option>
													<option value="offline">Offline</option>
												</select>
											</div>

											<div className="space-y-2">
												<label className="flex items-center gap-2 cursor-pointer">
													<input
														type="checkbox"
														checked={editForm.camera_on}
														onChange={(e) => setEditForm({ ...editForm, camera_on: e.target.checked })}
														disabled={isSaving}
													/>
													<span className="font-semibold text-slate-800">Camera On</span>
												</label>
												<label className="flex items-center gap-2 cursor-pointer">
													<input
														type="checkbox"
														checked={editForm.team_introduced}
														onChange={(e) => setEditForm({ ...editForm, team_introduced: e.target.checked })}
														disabled={isSaving}
													/>
													<span className="font-semibold text-slate-800">Team Introduced</span>
												</label>
												<label className="flex items-center gap-2 cursor-pointer">
													<input
														type="checkbox"
														checked={editForm.needs_support}
														onChange={(e) => setEditForm({ ...editForm, needs_support: e.target.checked })}
														disabled={isSaving}
													/>
													<span className="font-semibold text-slate-800">Needs Support</span>
												</label>
											</div>

											<div>
												<label className="font-semibold text-slate-800 block mb-2">Idea Summary</label>
												<textarea
													value={editForm.idea_summary}
													onChange={(e) => setEditForm({ ...editForm, idea_summary: e.target.value })}
													disabled={isSaving}
													className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
													rows={2}
												/>
											</div>

											<div>
												<label className="font-semibold text-slate-800 block mb-2">Last Week Progress</label>
												<textarea
													value={editForm.last_week_progress}
													onChange={(e) => setEditForm({ ...editForm, last_week_progress: e.target.value })}
													disabled={isSaving}
													className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
													rows={2}
												/>
											</div>

											<div>
												<label className="font-semibold text-slate-800 block mb-2">Next Week Target</label>
												<textarea
													value={editForm.next_week_target}
													onChange={(e) => setEditForm({ ...editForm, next_week_target: e.target.value })}
													disabled={isSaving}
													className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
													rows={2}
												/>
											</div>

											<div>
												<label className="font-semibold text-slate-800 block mb-2">Support Details</label>
												<textarea
													value={editForm.support_details}
													onChange={(e) => setEditForm({ ...editForm, support_details: e.target.value })}
													disabled={isSaving}
													className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
													rows={2}
												/>
											</div>

											<div>
												<label className="font-semibold text-slate-800 block mb-2">Suggestions</label>
												<textarea
													value={editForm.suggestions}
													onChange={(e) => setEditForm({ ...editForm, suggestions: e.target.value })}
													disabled={isSaving}
													className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
													rows={2}
												/>
											</div>
										</>
									)}

									<div className="flex gap-3 pt-4 border-t border-gray-200">
										<button
											onClick={handleEditCancel}
											disabled={isSaving}
											className="flex-1 py-2 px-4 border border-gray-200 text-slate-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											Cancel
										</button>
										<button
											onClick={handleSaveEdit}
											disabled={isSaving}
											className="flex-1 py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											{isSaving ? "Saving..." : "Save Changes"}
										</button>
									</div>
								</div>
							) : (
								<>
									<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
										<div className="flex items-center gap-2">
											{checkpoint.is_absent ? (
												<XCircle size={16} className="text-red-600" />
											) : (
												<CheckCircle size={16} className="text-green-600" />
											)}
											<div>
												<p className="font-semibold text-blue-900">Status</p>
												<p className="text-sm text-blue-800">{checkpoint.is_absent ? "Absent" : "Present & Verified"}</p>
											</div>
										</div>
									</div>

									{checkpoint.idea_summary && (
										<div>
											<p className="font-semibold text-slate-800">Idea Summary</p>
											<p className="text-slate-600 leading-relaxed">{checkpoint.idea_summary}</p>
										</div>
									)}

									{checkpoint.team_introduced !== null && checkpoint.team_introduced !== undefined && (
										<div>
											<p className="font-semibold text-slate-800">Team Introduced</p>
											<p className="text-slate-600">{checkpoint.team_introduced ? "✓ Yes" : "✗ No"}</p>
										</div>
									)}

									{checkpoint.meeting_medium && (
										<div>
											<p className="font-semibold text-slate-800">Meeting Medium</p>
											<p className="text-slate-600 capitalize">{checkpoint.meeting_medium.replace("_", " ")}</p>
										</div>
									)}

									{checkpoint.camera_on !== null && checkpoint.camera_on !== undefined && (
										<div>
											<p className="font-semibold text-slate-800">Camera Status</p>
											<p className="text-slate-600">{checkpoint.camera_on ? "✓ On" : "✗ Off"}</p>
										</div>
									)}

									{checkpoint.last_week_progress && (
										<div>
											<p className="font-semibold text-slate-800">Last Week Progress</p>
											<p className="text-slate-600 leading-relaxed">{checkpoint.last_week_progress}</p>
										</div>
									)}

									{checkpoint.next_week_target && (
										<div>
											<p className="font-semibold text-slate-800">Next Week Target</p>
											<p className="text-slate-600 leading-relaxed">{checkpoint.next_week_target}</p>
										</div>
									)}

									{checkpoint.needs_support !== null && checkpoint.needs_support !== undefined && (
										<div>
											<p className="font-semibold text-slate-800">Needs Support</p>
											<p className="text-slate-600">{checkpoint.needs_support ? "✓ Yes" : "✗ No"}</p>
										</div>
									)}

									{checkpoint.support_details && (
										<div>
											<p className="font-semibold text-slate-800">Support Details</p>
											<p className="text-slate-600 leading-relaxed">{checkpoint.support_details}</p>
										</div>
									)}

									{checkpoint.suggestions && (
										<div>
											<p className="font-semibold text-slate-800">Suggestions</p>
											<p className="text-slate-600 leading-relaxed">{checkpoint.suggestions}</p>
										</div>
									)}

									{checkpoint.buddy_name && (
										<div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
											<p className="font-semibold text-purple-900">Verified by</p>
											<p className="text-purple-800">{checkpoint.buddy_name}</p>
										</div>
									)}
								</>
							)}
						</div>
					</div>
				</div>
			)}

			{showDeleteConfirm && (
				<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => !isDeleting && setShowDeleteConfirm(false)}>
					<div
						className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
						onClick={(e) => e.stopPropagation()}
					>
						<h3 className="text-lg font-bold text-slate-800 mb-2">Delete Checkpoint?</h3>
						<p className="text-slate-600 mb-6">
							Are you sure you want to delete the checkpoint for <strong>{teamName}</strong> - Checkpoint {checkpoint.checkpoint_number}? This action cannot be undone.
						</p>
						<div className="flex gap-3">
							<button
								onClick={() => !isDeleting && setShowDeleteConfirm(false)}
								disabled={isDeleting}
								className="flex-1 py-2 px-4 border border-gray-200 text-slate-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Cancel
							</button>
							<button
								onClick={handleDelete}
								disabled={isDeleting}
								className="flex-1 py-2 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isDeleting ? "Deleting..." : "Delete"}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
