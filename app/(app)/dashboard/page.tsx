import RoleGate from "@/components/layout/RoleGate"
import { createClient } from "@/lib/supabase/server"
import { UserProfile } from "@/types/user"
import ProfileCard from "./components/ProfileCard"
import StatsCards from "./components/StatsCards"
import { getDistrictName } from "@/lib/district"



export default async function DashboardPage() {
  const supabaseServer = await createClient()

  const { data: { user } } = await supabaseServer.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabaseServer
    .from("profiles")
    .select("id, full_name, role, district_id, campus_id, created_at")
    .eq("id", user.id)
    .single()

  if (!profile) return null

  const typedProfile = profile as UserProfile
  const role = typedProfile.role

  const districtName = await getDistrictName(supabaseServer, typedProfile.district_id)
  console.log("District Name:", districtName)
  const typedProfileWithDistrict = { ...typedProfile, district_name: districtName ?? undefined }

  return (
    <div className="space-y-6">

      <ProfileCard profile={typedProfileWithDistrict} />

      <StatsCards />

      <div className="flex gap-4">
        <RoleGate role={role} allow={['buddy', 'campus_coordinator', 'admin']}>
          <button className="bg-brand-blue text-white px-6 py-2 rounded-xl font-semibold shadow-lg hover:brightness-110 transition-all">
            Create Checkpoint
          </button>
        </RoleGate>
        <RoleGate role={role} allow={['qa_foreman', 'qa_watcher', 'admin']}>
          <button className="bg-slate-800 text-white px-6 py-2 rounded-xl font-semibold shadow-lg hover:bg-slate-700 transition-all">
            Feedback Inbox
          </button>
        </RoleGate>
      </div>

    </div>
  )
}

