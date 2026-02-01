import { redirect } from "next/navigation"
import { getMyProfile } from "@/lib/profile"
import { getUserStreak } from "@/lib/daily-updates"
import StreakSociety from "./components/StreakSociety"
import ProfileCard from "./components/ProfileCard.tsx"

export default async function ProfilePage() {
  const profile = await getMyProfile()
  if (!profile) redirect("/login")

  const streak = await getUserStreak(profile.id)

  return (
    <div className="max-w-9xl sm:max-w-4/5 md:max-w-11/12 mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Profile Section */}
        <div className="md:col-span-1 lg:col-span-2">
          <ProfileCard profile={profile} streak={streak} />
        </div>

        {/* Streak Society Section */}
        <div className="md:col-span-1 lg:col-span-2">
          <StreakSociety streak={streak} />
        </div>
      </div>
    </div>
  )
}