
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

export type AdminSettings = {
    id: string
    checkpoints_enabled: boolean
    allowed_checkpoint_number: number
    updated_at: string
}

export async function getAdminSettings(): Promise<AdminSettings | null> {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from("admin_settings")
            .select("*")
            .eq("id", "global")
            .single()

        if (error) {
            if (error.code === "PGRST116") {
                // Settings don't exist, return defaults
                console.log("[getAdminSettings] Settings not found, returning defaults")
                return {
                    id: "global",
                    checkpoints_enabled: true,
                    allowed_checkpoint_number: 2,
                    updated_at: new Date().toISOString(),
                }
            }
            console.error("[getAdminSettings] Database error:", error)
            throw error
        }

        if (!data) {
            console.warn("[getAdminSettings] No data returned")
            return null
        }

        // Ensure backward compatibility: if buddies_enabled column doesn't exist, default to true
        const settings: AdminSettings = {
            id: data.id,
            checkpoints_enabled: data.checkpoints_enabled ?? true,
            allowed_checkpoint_number: data.allowed_checkpoint_number,
            updated_at: data.updated_at,
        }

        console.log("[getAdminSettings] Returning fetched settings:", settings)
        return settings
    } catch (error) {
        console.error("[getAdminSettings] Caught error:", error)
        return null
    }
}

export async function isCheckpointsEnabled(): Promise<boolean> {
    try {
        const settings = await getAdminSettings()
        
        // If settings exist and have a boolean value, return it
        if (settings !== null && typeof settings.checkpoints_enabled === "boolean") {
            console.log("[isCheckpointsEnabled] Current setting is:", settings.checkpoints_enabled)
            return settings.checkpoints_enabled
        }
        
        // Only fallback to true if settings genuinely don't exist in database (first time)
        console.warn("[isCheckpointsEnabled] Settings not found or checkpoints_enabled is not a boolean")
        return true
    } catch (error) {
        console.error("[isCheckpointsEnabled] Error checking setting:", error)
        // On unexpected error, default to enabled (fail open)
        return true
    }
}

export async function getAllowedCheckpointNumber(): Promise<number> {
    try {
        const settings = await getAdminSettings()
        
        if (settings !== null && typeof settings.allowed_checkpoint_number === "number") {
            console.log("[getAllowedCheckpointNumber] Current setting is:", settings.allowed_checkpoint_number)
            return settings.allowed_checkpoint_number
        }
        
        // If not set in database, throw error
        throw new Error("Allowed checkpoint number not configured in admin settings")
    } catch (error) {
        console.error("[getAllowedCheckpointNumber] Error checking setting:", error)
        throw error
    }
}
