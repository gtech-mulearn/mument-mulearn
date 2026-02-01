import { createClient } from "@/lib/supabase/server"
import { Database } from "@/types/database.types"


export type Announcement = Database["public"]["Tables"]["announcements"]["Row"]

export async function getAnnouncements() {
    const supabase = await createClient()
    // const user = await getMyProfile()

    const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20)

    if (error) {
        console.error("Error fetching announcements:", error)
        return []
    }

    return data as Announcement[]
}

export async function createAnnouncement(content: string) {
    const supabase = await createClient()
    const { error } = await supabase.from("announcements").insert({ content })
    if (error) throw error
}
