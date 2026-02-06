export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            announcements: {
                Row: {
                    id: number
                    created_at: string
                    content: string
                }
                Insert: {
                    id?: never
                    created_at?: string
                    content: string
                }
                Update: {
                    id?: never
                    created_at?: string
                    content?: string
                }
            }
            badges: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                }
            }
            buddies: {
                Row: {
                    id: string
                    created_at: string
                    user_id: string
                    name: string
                }
            }
            colleges: {
                Row: {
                    id: string
                    name: string
                    created_at: string | null
                }
            }
            checkpoints: {
                Row: {
                    id: string
                    buddy_id: string
                    team_id: string
                    campus_id: string
                    checkpoint_number: number
                    is_absent: boolean
                    meeting_medium: string | null // 'google_meet', 'zoom', 'offline'
                    camera_on: boolean | null
                    team_introduced: boolean | null
                    idea_summary: string | null
                    last_week_progress: string | null
                    next_week_target: string | null
                    needs_support: boolean | null
                    support_details: string | null
                    suggestions: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    buddy_id: string
                    team_id: string
                    campus_id: string
                    checkpoint_number: number
                    is_absent?: boolean
                    meeting_medium?: string | null
                    camera_on?: boolean | null
                    team_introduced?: boolean | null
                    idea_summary?: string | null
                    last_week_progress?: string | null
                    next_week_target?: string | null
                    needs_support?: boolean | null
                    support_details?: string | null
                    suggestions?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    buddy_id?: string
                    team_id?: string
                    campus_id?: string
                    checkpoint_number?: number
                    is_absent?: boolean
                    meeting_medium?: string | null
                    camera_on?: boolean | null
                    team_introduced?: boolean | null
                    idea_summary?: string | null
                    last_week_progress?: string | null
                    next_week_target?: string | null
                    needs_support?: boolean | null
                    support_details?: string | null
                    suggestions?: string | null
                    created_at?: string
                }
            }
            daily_updates: {
                Row: {
                    id: string
                    user_id: string | null
                    content: string
                    created_at: string | null
                    college_id: string | null
                }
            }
            feedback: {
                Row: {
                    id: string
                    created_at: string
                    created_by: string
                    subject: string
                    description: string
                    category: string
                    status: string // 'new', 'viewed', 'escalated', 'resolved'
                    campus_id: string | null // inferred from user for filtering
                }
                Insert: {
                    id?: string
                    created_at?: string
                    created_by: string
                    subject: string
                    description: string
                    category: string
                    status?: string
                    campus_id?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    created_by?: string
                    subject?: string
                    description?: string
                    category?: string
                    status?: string
                    campus_id?: string | null
                }
            }
            districts: {
                Row: {
                    id: string
                    name: string
                    created_at: string | null
                }
            }
            points_log: {
                Row: {
                    id: string
                    user_id: string | null
                    points: number
                    reason: string | null
                    created_at: string | null
                }
            }
            profiles: {
                Row: {
                    id: string
                    full_name: string
                    role: Database["public"]["Enums"]["user_role"]
                    email: string | null
                    district_id: string
                    campus_id: string | null
                    team_id: string | null
                    created_at: string | null
                }
                Insert: {
                    id: string
                    full_name: string
                    role?: Database["public"]["Enums"]["user_role"]
                    district_id?: string
                    campus_id?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    full_name?: string
                    role?: Database["public"]["Enums"]["user_role"]
                    district_id?: string
                    campus_id?: string | null
                    created_at?: string | null
                }
            }
            teams: {
                Row: {
                    id: string
                    team_code: string
                    team_name: string
                    campus_id: string
                    district_id: string
                    created_at: string | null
                }
            }
            team_members: {
                Row: {
                    id: string
                    team_id: string
                    user_id: string
                    created_at: string | null
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            user_role: "participant" | "buddy" | "campus_coordinator" | "qa_foreman" | "qa_watcher" | "zonal_lead" | "admin"
            checkpoint_scope: string // Placeholder as actual values weren't provided, assuming strings
        }
    }
}
