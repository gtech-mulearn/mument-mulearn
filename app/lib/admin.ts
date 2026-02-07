
import { createClient } from "@/lib/supabase/server"
import { Role } from "@/types/user"

export type AdminUserView = {
    id: string
    full_name: string
    role: Role
    email?: string | null // Added email field
    district_id: string
    campus_id: string | null
    created_at: string | null
    team_id: string | null
    // Joined fields
    district_name?: string
    campus_name?: string
}

export type UserFilters = {
    role?: Role | "all"
    district_id?: string
    campus_id?: string
    search?: string
}

export async function getUsers(filters: UserFilters = {}, limit = 50, offset = 0) {
    const supabase = await createClient()

    let query = supabase.from("profiles").select(`
        id, full_name, role, email, district_id, campus_id, created_at, team_id,
        districts ( name ),
        colleges ( name )
    `, { count: "estimated" })

    if (filters.role && filters.role !== "all") {
        query = query.eq("role", filters.role)
    }

    if (filters.district_id && filters.district_id !== "all") {
        query = query.eq("district_id", filters.district_id)
    }

    if (filters.campus_id && filters.campus_id !== "all") {
        query = query.eq("campus_id", filters.campus_id)
    }

    if (filters.search) {
        query = query.ilike("full_name", `%${filters.search}%`)
    }

    // Add count option
    const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

    if (error) {
        console.error("Error fetching users:", error)
        return { users: [], total: 0 }
    }

    // Flatten the joined data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const users = data.map((u: any) => ({
        ...u,
        district_name: u.districts?.name,
        campus_name: u.colleges?.name
    })) as AdminUserView[]

    return { users, total: count || 0 }
}

export async function getReferenceData() {
    const supabase = await createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [districts, campuses, teams] = await Promise.all([
        supabase.from("districts").select("id, name").order("name"),
        supabase.from("colleges").select("id, name").order("name"),
        supabase.from("teams").select("id, team_code, team_name, campus_id").order("team_name")
    ])

    // Transform teams data to match expected format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedTeams = ((teams.data as any[]) || []).map((team) => ({
        id: team.id,
        team_code: team.team_code,
        name: team.team_name,
        campus_id: team.campus_id
    }))

    return {
        districts: districts.data || [],
        campuses: campuses.data || [],
        teams: transformedTeams
    }
}
