
import { getUsers, getReferenceData, UserFilters } from "@/lib/admin"
import { getTeams } from "@/lib/team"
import { getMyProfile } from "@/lib/profile"
import { redirect } from "next/navigation"
import { Role } from "@/types/user"
import Link from "next/link"
import { Settings, UsersIcon, User2 } from "lucide-react"
import UserManagementTable from "./components/UserManagementTable"
import TeamManagementTable from "./teams/components/TeamManagementTable"
import NudgeButton from "./components/NudgeButton"

export default async function AdminPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams
    const user = await getMyProfile()

    // Check Access
    if (!user || !["admin", "campus_coordinator"].includes(user.role)) {
        redirect("/dashboard")
    }

    const tab = (searchParams.tab as string) || "users"
    const page = parseInt((searchParams.page as string) || "1")
    const limit = 50
    const offset = (page - 1) * limit

    const userFilters: UserFilters = {
        role: (searchParams.role as Role) || undefined,
        district_id: (searchParams.district_id as string) || undefined,
        campus_id: (searchParams.campus_id as string) || undefined,
        search: (searchParams.search as string) || undefined,
    }

    // Enforce Scope for Campus Coordinator
    if (user.role === "campus_coordinator") {
        if (!user.campus_id) {
            return <div>Error: You are a Campus Coordinator but have no assigned campus.</div>
        }
        userFilters.campus_id = user.campus_id
    }

    // Fetch data in parallel
    const [{ users, total: usersTotal }, { teams, total: teamsTotal }, refData] = await Promise.all([
        getUsers(userFilters, limit, offset),
        getTeams({
            campus_id: user.role === "campus_coordinator" 
                ? (user.campus_id || undefined) 
                : ((searchParams.campus as string) || undefined),
            search: (searchParams.search as string) || undefined
        }, limit, offset),
        getReferenceData()
    ])

    const totalPages = Math.ceil((tab === "users" ? usersTotal : teamsTotal) / limit)
    
    // Build query params to preserve filters when switching tabs
    const buildTabUrl = (newTab: string) => {
        const params = new URLSearchParams()
        params.set("tab", newTab)
        if (searchParams.search) params.set("search", searchParams.search as string)
        return `/admin?${params.toString()}`
    }

    return (
        <div className="py-8 px-6 max-w-7xl mx-auto">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
                    <p className="text-slate-500">Manage users, teams, and platform settings.</p>
                </div>
                <div className="flex items-center gap-3">
                    {user.role === "admin" && (
                        <Link
                            href="/admin/settings"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                        </Link>
                    )}
                    <NudgeButton />
                </div>
            </header>

            {/* Tabs */}
            <div className="mb-8 border-b border-gray-200">
                <div className="flex gap-8">
                    <Link
                        href={buildTabUrl("users")}
                        className={`pb-4 px-2 font-semibold transition-colors ${
                            tab === "users"
                                ? "text-brand-blue border-b-2 border-brand-blue"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <User2 className="w-4 h-4 mr-1 inline-block" />
                        Users
                    </Link>
                    <Link
                        href={buildTabUrl("teams")}
                        className={`pb-4 px-2 font-semibold transition-colors ${
                            tab === "teams"
                                ? "text-brand-blue border-b-2 border-brand-blue"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <UsersIcon className="w-4 h-4 mr-1 inline-block" />
                        Teams
                    </Link>
                </div>
            </div>

            {/* Users Tab */}
            {tab === "users" && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-slate-800">User Management</h2>
                        <div className="text-sm text-slate-400">
                            Total {usersTotal} users
                        </div>
                    </div>
                    <UserManagementTable
                        users={users}
                        districts={refData.districts}
                        campuses={refData.campuses}
                        teams={refData.teams}
                        currentPage={page}
                        totalPages={totalPages}
                        currentUserRole={user.role}
                        currentUserCampusId={user.campus_id}
                        currentUserDistrictId={user.district_id}
                    />
                </section>
            )}

            {/* Teams Tab */}
            {tab === "teams" && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-slate-800">Team Management</h2>
                        <div className="text-sm text-slate-400">
                            Total {teamsTotal} teams
                        </div>
                    </div>
                    <TeamManagementTable
                        teams={teams}
                        campuses={refData.campuses}
                        currentPage={page}
                        totalPages={totalPages}
                        searchQuery={(searchParams.search as string) || ""}
                        totalTeams={teamsTotal}
                        currentUserRole={user.role}
                    />
                </section>
            )}
        </div>
    )
}
