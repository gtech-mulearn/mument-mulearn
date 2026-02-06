"use client"

import { useState } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { createCheckpointVerificationAction } from "@/actions"
import { useToast } from "@/components/ToastProvider"

interface Team {
    id: string
    team_name: string
}

interface CheckpointVerificationProps {
    availableTeams?: Team[]
    buddyId?: string
}

type MeetingMedium = "google_meet" | "zoom" | "offline"

interface FormData {
    team_id: string
    checkpoint_number: number
    is_absent: boolean
    meeting_medium: MeetingMedium
    camera_on: boolean
    team_introduced: boolean
    idea_summary: string
    last_week_progress: string
    next_week_target: string
    needs_support: boolean
    support_details?: string
    suggestions: string
}

const STEPS = [
    { id: 1, title: "Select Team & Checkpoint", description: "Choose team and checkpoint number" },
    { id: 2, title: "Team Status", description: "Is the team present?" },
    { id: 3, title: "Meeting Setup", description: "Meeting details and camera status" },
    { id: 4, title: "Team Introduction", description: "Did the team introduce themselves?" },
    { id: 5, title: "Team's Idea", description: "What is the team working on?" },
    { id: 6, title: "Progress", description: "Last week's progress" },
    { id: 7, title: "Next Steps", description: "Next week's target" },
    { id: 8, title: "Support Needed", description: "Do they need any support?" },
    { id: 9, title: "Review & Submit", description: "Your feedback and suggestions" }
]

export default function CheckpointVerification({ availableTeams = [] }: CheckpointVerificationProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const { show: showToast } = useToast()

    const [formData, setFormData] = useState<FormData>({
        team_id: "",
        checkpoint_number: 1,
        is_absent: false,
        meeting_medium: "google_meet",
        camera_on: false,
        team_introduced: false,
        idea_summary: "",
        last_week_progress: "",
        next_week_target: "",
        needs_support: false,
        support_details: "",
        suggestions: ""
    })

    const handleFieldChange = (field: keyof FormData, value: unknown) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    // Validation for current step
    const isStepValid = (): boolean => {
        switch (currentStep) {
            case 1:
                return formData.team_id !== "" && formData.checkpoint_number >= 1 && formData.checkpoint_number <= 4
            case 2:
                return formData.is_absent !== null
            case 3:
                return formData.is_absent || formData.camera_on
            case 4:
                return formData.is_absent || formData.team_introduced
            case 5:
                return formData.is_absent || formData.idea_summary.trim() !== ""
            case 6:
                return formData.is_absent || formData.last_week_progress.trim() !== ""
            case 7:
                return formData.is_absent || formData.next_week_target.trim() !== ""
            case 8:
                return formData.is_absent || !formData.needs_support || (formData.needs_support && (formData.support_details?.trim() !== ""))
            case 9:
                return formData.is_absent || formData.suggestions.trim() !== ""
            default:
                return false
        }
    }

    const goToNextStep = () => {
        if (isStepValid() && currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1)
        }
    }

    const goToPreviousStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation: If team is not absent, all fields are required
        if (!formData.is_absent) {
            if (!formData.team_id || !formData.meeting_medium || !formData.idea_summary || !formData.last_week_progress || !formData.next_week_target || !formData.suggestions) {
                showToast({
                    title: "Validation Error",
                    description: "All fields are required for present teams"
                })
                return
            }

            if (formData.needs_support && !formData.support_details?.trim()) {
                showToast({
                    title: "Validation Error",
                    description: "Please specify support details if support is needed"
                })
                return
            }
        }

        setLoading(true)
        try {
            const formDataToSubmit = new FormData()
            formDataToSubmit.append("team_id", formData.team_id)
            formDataToSubmit.append("checkpoint_number", String(formData.checkpoint_number))
            formDataToSubmit.append("is_absent", String(formData.is_absent))
            formDataToSubmit.append("meeting_medium", formData.meeting_medium)
            formDataToSubmit.append("camera_on", String(formData.camera_on))
            formDataToSubmit.append("team_introduced", String(formData.team_introduced))
            formDataToSubmit.append("idea_summary", formData.idea_summary)
            formDataToSubmit.append("last_week_progress", formData.last_week_progress)
            formDataToSubmit.append("next_week_target", formData.next_week_target)
            formDataToSubmit.append("needs_support", String(formData.needs_support))
            formDataToSubmit.append("support_details", formData.support_details || "")
            formDataToSubmit.append("suggestions", formData.suggestions)

            await createCheckpointVerificationAction(formDataToSubmit)

            showToast({
                title: "Success",
                description: "Checkpoint verification submitted successfully"
            })
            setIsOpen(false)
            setCurrentStep(1)
            setFormData({
                team_id: "",
                checkpoint_number: 1,
                is_absent: false,
                meeting_medium: "google_meet",
                camera_on: false,
                team_introduced: false,
                idea_summary: "",
                last_week_progress: "",
                next_week_target: "",
                needs_support: false,
                support_details: "",
                suggestions: ""
            })
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to submit checkpoint verification"
            showToast({
                title: "Error",
                description: errorMessage
            })
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition w-full sm:w-auto justify-center"
            >
                <ChevronRight size={18} />
                Verify Checkpoint
            </button>
        )
    }

    const currentStepData = STEPS[currentStep - 1]
    const selectedTeam = availableTeams.find(t => t.id === formData.team_id)

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Checkpoint Verification</h2>
                        <p className="text-sm text-slate-500">Step {currentStep} of {STEPS.length}</p>
                    </div>
                    <button
                        onClick={() => {
                            setIsOpen(false)
                            setCurrentStep(1)
                        }}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="px-6 pt-6">
                    <div className="flex gap-2">
                        {STEPS.map((step, idx) => (
                            <div key={step.id} className="flex-1">
                                <div
                                    className={`h-2 rounded-full transition-colors ${idx + 1 <= currentStep ? "bg-brand-blue" : "bg-gray-200"
                                        }`}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">{currentStepData.title}</h3>
                        <p className="text-sm text-slate-500 mb-4">{currentStepData.description}</p>
                    </div>

                    {/* Step 1: Select Team & Checkpoint Number */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Team *</label>
                                <select
                                    value={formData.team_id}
                                    onChange={(e) => handleFieldChange("team_id", e.target.value)}
                                    required
                                    className="w-full p-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                >
                                    <option value="">Choose a team</option>
                                    {availableTeams.map(team => (
                                        <option key={team.id} value={team.id}>
                                            {team.team_name}
                                        </option>
                                    ))}
                                </select>
                                {selectedTeam && (
                                    <p className="text-xs text-blue-600 mt-2">Selected: {selectedTeam.team_name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Checkpoint Number (1-4) *</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={4}
                                    value={formData.checkpoint_number}
                                    onChange={(e) => handleFieldChange("checkpoint_number", parseInt(e.target.value))}
                                    required
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                />
                                <p className="text-xs text-slate-500 mt-1">Each team can have 4 checkpoints (weekly)</p>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Team Status - Absent or Present */}
                    {currentStep === 2 && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">Is the team present? *</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-xl hover:bg-gray-50" style={{ flex: 1 }}>
                                    <input
                                        type="radio"
                                        name="is_absent"
                                        checked={!formData.is_absent}
                                        onChange={() => handleFieldChange("is_absent", false)}
                                        className="w-4 h-4"
                                    />
                                    <span className="font-medium text-slate-700">Present</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-xl hover:bg-gray-50" style={{ flex: 1 }}>
                                    <input
                                        type="radio"
                                        name="is_absent"
                                        checked={formData.is_absent}
                                        onChange={() => handleFieldChange("is_absent", true)}
                                        className="w-4 h-4"
                                    />
                                    <span className="font-medium text-slate-700">Absent</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {formData.is_absent ? (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4">
                            <p className="text-sm text-orange-700 font-medium">Team marked as absent. Ready to submit.</p>
                        </div>
                    ) : (
                        <>
                            {/* Step 3: Meeting Setup */}
                            {currentStep === 3 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Meeting Medium *</label>
                                        <div className="flex gap-3">
                                            {[
                                                { value: "google_meet", label: "Google Meet" },
                                                { value: "zoom", label: "Zoom" },
                                                { value: "offline", label: "Offline" }
                                            ].map(option => (
                                                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="meeting_medium"
                                                        value={option.value}
                                                        checked={formData.meeting_medium === option.value}
                                                        onChange={(e) => handleFieldChange("meeting_medium", e.target.value as MeetingMedium)}
                                                        className="w-4 h-4"
                                                    />
                                                    <span className="text-sm text-slate-700">{option.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.camera_on}
                                                onChange={(e) => handleFieldChange("camera_on", e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-300"
                                            />
                                            <span className="text-sm font-medium text-slate-700">Camera is ON</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Team Introduction */}
                            {currentStep === 4 && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-3">Did the team introduce themselves? *</label>
                                    <div className="flex gap-3">
                                        {[
                                            { value: true, label: "Yes" },
                                            { value: false, label: "No" }
                                        ].map(option => (
                                            <label key={String(option.value)} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="team_introduced"
                                                    checked={formData.team_introduced === option.value}
                                                    onChange={() => handleFieldChange("team_introduced", option.value)}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-sm text-slate-700">{option.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 5: Team's Idea */}
                            {currentStep === 5 && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">What is the team&apos;s idea/project? *</label>
                                    <textarea
                                        value={formData.idea_summary}
                                        onChange={(e) => handleFieldChange("idea_summary", e.target.value)}
                                        rows={4}
                                        required
                                        minLength={3}
                                        placeholder="Describe the team&apos;s idea/project..."
                                        className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">{formData.idea_summary.length}/500</p>
                                </div>
                            )}

                            {/* Step 6: Last Week Progress */}
                            {currentStep === 6 && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Last Week&apos;s Progress *</label>
                                    <textarea
                                        value={formData.last_week_progress}
                                        onChange={(e) => handleFieldChange("last_week_progress", e.target.value)}
                                        rows={4}
                                        required
                                        minLength={3}
                                        placeholder="What did the team accomplish last week?"
                                        className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">{formData.last_week_progress.length}/500</p>
                                </div>
                            )}

                            {/* Step 7: Next Week Target */}
                            {currentStep === 7 && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Next Week&apos;s Target *</label>
                                    <textarea
                                        value={formData.next_week_target}
                                        onChange={(e) => handleFieldChange("next_week_target", e.target.value)}
                                        rows={4}
                                        required
                                        placeholder="What is the team planning to do next week?"
                                        minLength={3}
                                        className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">{formData.next_week_target.length}/500</p>
                                </div>
                            )}

                            {/* Step 8: Support Needed */}
                            {currentStep === 8 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-3">Does the team need any support? *</label>
                                        <div className="flex gap-3">
                                            {[
                                                { value: true, label: "Yes" },
                                                { value: false, label: "No" }
                                            ].map(option => (
                                                <label key={String(option.value)} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="needs_support"
                                                        checked={formData.needs_support === option.value}
                                                        onChange={() => handleFieldChange("needs_support", option.value)}
                                                        className="w-4 h-4"
                                                    />
                                                    <span className="text-sm text-slate-700">{option.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {formData.needs_support && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Specify Support/Mentor Needed *
                                            </label>
                                            <textarea
                                                value={formData.support_details || ""}
                                            onChange={(e) => handleFieldChange("support_details", e.target.value)}
                                            rows={4}
                                            required
                                            placeholder={formData.needs_support ? "What kind of support or mentorship does the team need?" : "Describe why support is not needed or any supportive comments..."}
                                            className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">{(formData.support_details || "").length}/500</p>
                                    </div>)}
                                </div>
                            )}

                            {/* Step 9: Suggestions */}
                            {currentStep === 9 && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Your Suggestions & Feedback *</label>
                                    <textarea
                                        value={formData.suggestions}
                                        onChange={(e) => handleFieldChange("suggestions", e.target.value)}
                                        rows={4}
                                        required
                                        placeholder="Provide your feedback and suggestions for the team..."
                                        className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">{formData.suggestions.length}/500</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-3 pt-6">
                        <button
                            type="button"
                            onClick={goToPreviousStep}
                            disabled={currentStep === 1}
                            className="flex-1 py-3 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <ChevronLeft size={18} />
                            Previous
                        </button>

                        {currentStep < STEPS.length ? (
                            <button
                                type="button"
                                onClick={goToNextStep}
                                disabled={!isStepValid()}
                                className="flex-1 py-3 bg-brand-blue text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                Next
                                <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={loading || !isStepValid()}
                                className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Submitting..." : "Submit Verification"}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}
