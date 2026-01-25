export interface LeaderboardEntry {
  userId: string
  name: string
  college: string
  district: string
  points: number
  rank: number
}

export interface LeaderboardFilters {
  scope: "campus" | "district" | "kerala"
  timeframe: "weekly" | "overall"
}
