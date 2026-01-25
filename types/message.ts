export interface Message {
  id: string
  senderId: string
  receiverId: string

  content: string
  created_at: string
  isRead: boolean
}
