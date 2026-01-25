export interface Checkpoint {
  id: string
  participantId: string
  buddyId: string

  week: number
  summary: string

  created_at: string
  updated_at: string
}
