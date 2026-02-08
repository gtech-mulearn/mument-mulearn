import { getCheckpoints, getBuddyVerifiableTeams } from "@/lib/checkpoints"
import { getMyProfile } from "@/lib/profile"
import { isCheckpointsEnabled } from "@/lib/admin"
import { Role } from "@/types/user"
import CheckpointVerification from "./components/CheckpointVerification"
import CheckpointExpanded from "./components/CheckpointExpanded"
import ExportButton from "./components/ExportButton"

// Ensure this page is always rendered dynamically (never cached)
export const dynamic = "force-dynamic"

export default async function CheckpointsPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams
    const user = await getMyProfile()
    const role = (user?.role || "participant") as Role
    
    const page = parseInt((searchParams.page as string) || "1")
    const limit = 50
    const offset = (page - 1) * limit

    const checkpointsResult = await getCheckpoints(limit, offset)
    const checkpoints = checkpointsResult.data
    const totalPages = checkpointsResult.totalPages

    let verifiableTeams: { id: string, team_name: string }[] = []
    
    // Both buddy and campus_coordinator can verify checkpoints on teams in their campus
    if (user && (role === "buddy" || role === "campus_coordinator")) {
        verifiableTeams = await getBuddyVerifiableTeams()
    }

    const checkpointsEnabled = await isCheckpointsEnabled()

    return (
        <div className="py-8 px-6">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-brand-blue">Checkpoints</h1>
                    <p className="text-sm text-slate-500">Weekly checkpoint verification records</p>
                </div>
                <div className="flex gap-3">
                    {/* Checkpoint verification form */}
                    {(checkpointsEnabled) && (
                        <CheckpointVerification availableTeams={verifiableTeams} completedCheckpoints={checkpoints} />
                    )}
                    {role === "admin" && (
                        <ExportButton />
                    )}
                </div>
            </header>

            {checkpoints.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-500">
                        {role === "buddy" ? "No checkpoints verified yet. Start verifying team checkpoints!" : "No checkpoints to display."}
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {checkpoints.map((c) => (
                            <CheckpointExpanded key={c.id} checkpoint={c} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-8 flex justify-center gap-2">
                            {[...Array(totalPages)].map((_, i) => {
                                const pageNum = i + 1
                                const isActive = pageNum === page
                                return (
                                    <a
                                        key={pageNum}
                                        href={`?page=${pageNum}`}
                                        className={`px-3 py-2 rounded-lg transition-colors ${
                                            isActive
                                                ? "bg-brand-blue text-white"
                                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                        }`}
                                    >
                                        {pageNum}
                                    </a>
                                )
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}