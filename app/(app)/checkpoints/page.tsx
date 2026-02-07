import { getCheckpoints, getBuddyVerifiableTeams } from "@/lib/checkpoints"
import { permissions } from "@/lib/permissions"
import { getMyProfile } from "@/lib/profile"
import { Role } from "@/types/user"
import CheckpointVerification from "./components/CheckpointVerification"
import CheckpointExpanded from "./components/CheckpointExpanded"

export default async function CheckpointsPage() {
    const user = await getMyProfile()
    const role = (user?.role || "participant") as Role
    const checkpoints = await getCheckpoints()

    let verifiableTeams: { id: string, team_name: string }[] = []
    
    // Both buddy and campus_coordinator can verify checkpoints on teams in their campus
    if (user && (role === "buddy" || role === "campus_coordinator")) {
        verifiableTeams = await getBuddyVerifiableTeams()
    }

    return (
        <div className="py-8 px-6">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-brand-blue">Checkpoints</h1>
                    <p className="text-sm text-slate-500">Weekly checkpoint verification records</p>
                </div>
                <div className="flex gap-3">
                    {/* Checkpoint verification form */}
                    {permissions.canCreateCheckpoints(role) && (
                        <CheckpointVerification availableTeams={verifiableTeams} completedCheckpoints={checkpoints} />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {checkpoints.map((c) => (
                        <CheckpointExpanded key={c.id} checkpoint={c} />
                    ))}
                </div>
            )}
        </div>
    )
}