export interface Pagination {
  page: number
  limit: number
}

export interface ApiResponse<T> {
  data: T
  error?: string
}
