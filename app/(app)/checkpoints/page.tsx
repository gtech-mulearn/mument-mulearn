import { getCheckpoints, getBuddyVerifiableTeams, getCollegesForFiltering, CheckpointWithJoins } from "@/lib/checkpoints"
import { getMyProfile } from "@/lib/profile"
import { isCheckpointsEnabled } from "@/lib/admin"
import { Role } from "@/types/user"
import CheckpointVerification from "./components/CheckpointVerification"
import CheckpointSearchResults from "./components/CheckpointSearchResults"

// Ensure this page is always rendered dynamically (never cached)
export const dynamic = "force-dynamic"

export default async function CheckpointsPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams
    const user = await getMyProfile()
    const role = (user?.role || "participant") as Role
    
    // Fetch all checkpoints for search and display (batched to avoid per-request row caps)
    const pageSize = 1000
    let offset = 0
    let total = 0
    let allCheckpoints: CheckpointWithJoins[] = []

    while (true) {
        const batchResult = await getCheckpoints(pageSize, offset)

        if (offset === 0) {
            total = batchResult.total
        }

        if (!batchResult.data.length) {
            break
        }

        allCheckpoints = allCheckpoints.concat(batchResult.data)

        if (allCheckpoints.length >= total || batchResult.data.length < pageSize) {
            break
        }

        offset += pageSize
    }

    // Fetch colleges for filter dropdown
    const colleges = await getCollegesForFiltering()

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
                        <CheckpointVerification availableTeams={verifiableTeams} completedCheckpoints={allCheckpoints} />
                    )}
                </div>
            </header>

            {allCheckpoints.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-500">
                        {role === "buddy" ? "No checkpoints verified yet. Start verifying team checkpoints!" : "No checkpoints to display."}
                    </p>
                </div>
            ) : (
                <CheckpointSearchResults checkpoints={allCheckpoints} colleges={colleges} userRole={role} />
            )}
        </div>
    )
}