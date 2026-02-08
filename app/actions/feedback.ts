'use server'

import { submitFeedback as submitFeedbackLib } from "@/lib/feedback"

export async function submitFeedback(feedback: {
  subject: string
  description: string
  category: string
}) {
  try {
    await submitFeedbackLib(feedback)
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit feedback"
    return { error: message }
  }
}
