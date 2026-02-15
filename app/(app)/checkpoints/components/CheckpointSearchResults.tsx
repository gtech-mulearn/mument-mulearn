"use client"

import { useState, useMemo } from "react"
import { CheckpointWithJoins } from "@/lib/checkpoints"
import { Role } from "@/types/user"
import CheckpointSearch from "./CheckpointSearch"
import CheckpointExpanded from "./CheckpointExpanded"

interface CheckpointSearchResultsProps {
    checkpoints: CheckpointWithJoins[]
    colleges: Array<{ id: string; name: string }>
    userRole: Role
}

export default function CheckpointSearchResults({ 
    checkpoints, 
    colleges,
    userRole
}: CheckpointSearchResultsProps) {
    const [filteredCheckpoints, setFilteredCheckpoints] = useState<CheckpointWithJoins[]>(checkpoints)

    const isFiltered = useMemo(() => {
        return filteredCheckpoints.length !== checkpoints.length
    }, [filteredCheckpoints, checkpoints])

    return (
        <div>
            {/* Search and Filter Component */}
            <CheckpointSearch 
                checkpoints={checkpoints} 
                colleges={colleges}
                userRole={userRole}
                onFilterChange={setFilteredCheckpoints}
            />

            {/* Results Grid */}
            {filteredCheckpoints.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-500">
                        No checkpoints match your filters. Try adjusting your search criteria.
                    </p>
                </div>
            ) : (
                <div>
                    {isFiltered && (
                        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                            Showing {filteredCheckpoints.length} of {checkpoints.length} checkpoints
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCheckpoints.map((c) => (
                            <CheckpointExpanded key={c.id} checkpoint={c} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
