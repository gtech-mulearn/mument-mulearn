import { Role } from "./role"

export interface UserProfile {
  id: string
  name: string
  email: string
  college: string
  district: string
  role: Role
  points: number
  created_at: string
}
