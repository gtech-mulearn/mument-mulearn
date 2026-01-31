import { redirect } from "next/navigation"
import { getMyProfile } from "@/lib/profile"
import Link from "next/link"

export default async function ProfilePage() {
  const profile = await getMyProfile()
  if (!profile) redirect("/login")

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="flex items-center gap-6 p-6">
          <div
            className="h-20 w-20 rounded-full flex items-center justify-center text-3xl font-bold text-white bg-[#2e85fe]"
            aria-hidden
          >
            {profile.full_name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-slate-900">{profile.full_name}</h1>
            <p className="text-sm text-slate-600">{profile.role ?? "Member"}</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-sm text-slate-500">
                Joined: {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}
              </span>
              <span className="h-4 w-px bg-slate-200" />
              <Link
                href="/profile/edit"
                className="text-sm px-3 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Edit profile
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-6 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-800">
            <div>
              <div className="text-xs text-slate-500">Campus</div>
              <div className="mt-1 font-medium">
                {profile.campus_name ?? profile.campus_id ?? "Not assigned"}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Contact</div>
              <div className="mt-1 font-medium">
                {(profile as { email?: string, email_id?: string }).email ?? (profile as { email?: string, email_id?: string }).email_id ?? "Not provided"}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500">District</div>
              <div className="mt-1 font-medium">
                {profile.district_name ?? profile.district_id ?? "Not assigned"}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500">Role</div>
              <div className="mt-1 font-medium">{profile.role ?? "Member"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}