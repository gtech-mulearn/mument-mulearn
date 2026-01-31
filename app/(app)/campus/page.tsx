import { getUsers, getReferenceData, UserFilters } from "@/lib/admin"
import { getMyProfile } from "@/lib/profile"
import { redirect } from "next/navigation"
import CampusUserTable from "./components/CampusUserTable"

export default async function CampusPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams
    const user = await getMyProfile()

    // Check if user is campus coordinator
    if (!user || user.role !== "campus_coordinator") {
        redirect("/dashboard")
    }

    // Campus coordinator must have a campus_id
    if (!user.campus_id) {
        redirect("/dashboard")
    }

    const page = parseInt((searchParams.page as string) || "1")
    const limit = 50
    const offset = (page - 1) * limit

    // Filter to show only users from the same campus
    const filters: UserFilters = {
        campus_id: user.campus_id,
        role: (searchParams.role as any) || undefined,
        search: (searchParams.search as string) || undefined,
    }

    // Fetch data in parallel
    const [{ users, total }, refData] = await Promise.all([
        getUsers(filters, limit, offset),
        getReferenceData()
    ])

    const totalPages = Math.ceil(total / limit)
    const campusName = refData.campuses.find(c => c.id === user.campus_id)?.name || "Campus"

    return (
        <div className="py-8 px-6 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Campus Management</h1>
                <p className="text-slate-500">Manage users under {campusName}</p>
            </header>

            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-slate-800">User Management</h2>
                    <div className="text-sm text-slate-400">
                        Total {total} users
                    </div>
                </div>
                <CampusUserTable
                    users={users}
                    districts={refData.districts}
                    campuses={refData.campuses}
                    currentPage={page}
                    totalPages={totalPages}
                />
            </section>
        </div>
    )
}