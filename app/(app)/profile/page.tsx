import { redirect } from "next/navigation"
import { getMyProfile } from "@/lib/profile"
import { getUserStreak } from "@/lib/daily-updates"
import StreakSociety from "./components/StreakSociety"
import ProfileCard from "./components/ProfileCard"
import BuddyTeamSelect from "./components/BuddyTeamSelect"
import { getBuddyId } from "@/lib/roles"

export default async function ProfilePage() {
  const profile = await getMyProfile()
  if (!profile) redirect("/login")

  const buddyId = await getBuddyId()
  const streak = await getUserStreak(profile.id)

  // Show BuddyTeamSelect if user is a buddy or has a buddy ID (can have multiple roles)
  const isBuddy = profile.role === "buddy" || buddyId?.length !== 0

  return (
    <div className="max-w-9xl sm:max-w-4/5 md:max-w-11/12 mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Profile Section */}
        <div className="md:col-span-1 lg:col-span-2">
          <ProfileCard profile={profile} streak={streak} />
          {isBuddy && (
            <div className="m-4">
              <BuddyTeamSelect />
            </div>
          )}
        </div>

        {/* Streak Society Section */}
        <div className="md:col-span-1 lg:col-span-2">
          <StreakSociety streak={streak} />
        </div>
      </div>
    </div>
  )
}