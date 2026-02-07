import { getTeams } from "@/lib/team"
import { getReferenceData } from "@/lib/admin"
import { getMyProfile } from "@/lib/profile"
import { redirect } from "next/navigation"
import TeamManagementTable from "./components/TeamManagementTable"

export default async function TeamsPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams
    const user = await getMyProfile()

    // Check access - only admin
    if (!user || user.role !== "admin") {
        redirect("/admin")
    }

    const page = parseInt((searchParams.page as string) || "1")
    const search = (searchParams.search as string) || ""
    const campusId = (searchParams.campus as string) || ""
    const limit = 50
    const offset = (page - 1) * limit

    // Fetch teams and reference data in parallel
    const [{ teams, total }, refData] = await Promise.all([
        getTeams({ search, campus_id: campusId }, limit, offset),
        getReferenceData()
    ])

    const totalPages = Math.ceil(total / limit)

    return (
        <div className="py-8 px-6 max-w-7xl mx-auto">
            <header className="mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Team Management</h1>
                    <p className="text-slate-500">Create, edit, and manage teams across campuses</p>
                </div>
            </header>

            <section>
                <TeamManagementTable
                    teams={teams}
                    campuses={refData.campuses}
                    currentPage={page}
                    totalPages={totalPages}
                    searchQuery={search}
                    totalTeams={total}
                />
            </section>
        </div>
    )
}
