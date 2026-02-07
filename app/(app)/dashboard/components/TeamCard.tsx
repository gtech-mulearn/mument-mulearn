'use client';

import { UserProfile } from "@/types/user";
import { getTeamMembersDailyUpdateStatus } from "@/lib/profile";
import { useEffect, useState } from "react";


export default function TeamCard({ profile }: { profile: UserProfile }) {

    const [teamMembers, setTeamMembers] = useState<Array<{ id: string; full_name: string; hasUpdatedToday: boolean }>>([])
    const[loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchTeamMembers = async () => {
            if (!profile.team_id) return
            setLoading(true)
            const members = await getTeamMembersDailyUpdateStatus(profile.team_id)
            // console.log("Fetched team members:", members)
            setTeamMembers(members || [])
            setLoading(false)
        }
        fetchTeamMembers()
    }, [profile.team_id])


    console.log("Team Members:", teamMembers)

  return (
    <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Team Information</h2>
        <div className="space-y-4 bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex flex-row justify-between px-5 py-2"><div>
                <div className="text-xs text-slate-500">Team Name</div>
                <div className="mt-1 font-medium">{profile.team_name ?? "Not assigned"}</div>
            </div>
            <div>
                <div className="text-xs text-slate-500">Team Code</div>
                <div className="mt-1 font-medium">{profile.team_code ?? "N/A"}</div>
            </div>
            </div>
            <div>
                <div className="text-xs text-slate-500">Team Members</div>
                <div className="mt-1 font-medium">
                    {loading ? (
                        <span>Loading...</span>
                    ) : teamMembers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {teamMembers.map(member => (
                                <div key={member.id} className={`p-4 border rounded-lg ring-accent-foreground transition-shadow ${member.hasUpdatedToday ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                    <p className="font-medium text-slate-900">{member.full_name}</p>
                                    <p className="text-xs text-slate-500 mt-1">{member.hasUpdatedToday ? '✓ Updated today' : '✗ Not updated'}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <span>No team members found.</span>
                    )}
                </div>
            </div>
        </div>
    </div>
  )
}