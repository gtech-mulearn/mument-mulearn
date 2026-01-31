import RoleGate from "@/components/layout/RoleGate"
import { UserProfile } from "@/types/user"
import ProfileCard from "./components/ProfileCard"
import StatsCards from "./components/StatsCards"
import { getMyProfile } from "@/lib/profile"
import DashboardWelcome from "@/components/DashboardWelcome"
import { getUserPoints } from "@/lib/points"
import { getDailyUpdateStats, getCampusStats, getDistrictStats } from "@/lib/stats"
import { getDailyUpdateStats as getCampusDailyStats, getTopContributors, getCampusAnalytics } from "@/lib/campus-stats"
import AdminStats from "./components/AdminStats"
import CampusStats from "./components/CampusStats"


export default async function DashboardPage() {
  const profile = await getMyProfile()
  if (!profile) return null

  const typedProfile = profile as UserProfile
  const role = typedProfile.role
  const points = await getUserPoints(typedProfile.id)

  // Fetch stats only if admin
  let statsProps = null
  if (role === 'admin') {
    const [daily, campus, district] = await Promise.all([
      getDailyUpdateStats(),
      getCampusStats(),
      getDistrictStats()
    ])
    statsProps = { daily, campus, district }
  }

  // Fetch campus stats only if campus coordinator
  let campusStatsProps = null
  if (role === 'campus_coordinator' && typedProfile.campus_id) {
    const [daily, contributors, analytics] = await Promise.all([
      getCampusDailyStats(),
      getTopContributors(typedProfile.campus_id),
      getCampusAnalytics(typedProfile.campus_id)
    ])
    campusStatsProps = { daily, contributors, analytics }
  }

  return (
    <>
      <div className="space-y-6">

        <DashboardWelcome profile={typedProfile} />

        <ProfileCard profile={typedProfile} />

        <StatsCards points={points} />



        {/* Admin Analytics Section */}
        <RoleGate role={role} allow={['admin']}>
          {statsProps && <AdminStats
            dailyStats={statsProps.daily}
            campusStats={statsProps.campus}
            districtStats={statsProps.district}
          />}
        </RoleGate>

        {/* Campus Analytics Section */}
        <RoleGate role={role} allow={['campus_coordinator']}>
          {campusStatsProps && <CampusStats
            dailyStats={campusStatsProps.daily}
            topContributors={campusStatsProps.contributors}
            analytics={campusStatsProps.analytics}
          />}
        </RoleGate>

        {/* Standard User Team Details (Visible to non-admins) */}
        {role !== 'admin' && (
          <div>
            <h1 className="text-2xl font-bold text-black">Team details</h1>
            {/* Team details content would go here */}
          </div>
        )}

      </div>
    </>

  )
}
