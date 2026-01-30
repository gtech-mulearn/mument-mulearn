// import { redirect } from "next/navigation"
// import { ReactNode } from "react"
// import Sidebar from "@/components/layout/Sidebar"
// import { createClient } from "@/lib/supabase/server"
// import { UserProfile } from "@/types/user"

// export default async function AppLayout({
//   children,
// }: {
//   children: ReactNode
// }) {
//   const supabaseServer = await createClient()

//   // 1️⃣ Auth check (server-side)
//   const {
//     data: { user },
//   } = await supabaseServer.auth.getUser()

//   if (!user) {
//     redirect("/login")
//   }

//   // 2️⃣ Fetch profile with role (RLS enforced)
//   const { data: profile, error } = await supabaseServer
//     .from("profiles")
//     .select("id, full_name, role, district_id, campus_id, created_at")
//     .eq("id", user.id)
//     .single()

//   if (error) {
//     console.error("❌ Profile fetch error:", {
//       code: error.code,
//       message: error.message,
//       details: error.details,
//       userId: user.id,
//     })
//     redirect("/login")
//   }

//   if (!profile) {
//     console.error("❌ No profile row found for user:", user.id)
//     redirect("/login")
//   }

//   const typedProfile = profile as UserProfile

//   return (
//     <div style={{ display: "flex", minHeight: "100vh" }}>
//       <Sidebar role={typedProfile.role} />

//       <main style={{ flex: 1, padding: "1rem" }}>
//         <p>User: {typedProfile.full_name} | Role: {typedProfile.role}</p>
//         {children}
//       </main>
//     </div>
//   )
// }

// import { redirect } from "next/navigation"
// import { ReactNode } from "react"
// import Sidebar from "@/components/layout/Sidebar"
// import DashboardHeader from "./dashboard/components/DashboardHeader"
// import { createClient } from "@/lib/supabase/server"
// import { UserProfile } from "@/types/user"

// export default async function AppLayout({
//   children,
// }: {
//   children: ReactNode
// }) {
//   const supabaseServer = await createClient()

//   // 1️⃣ Auth check (server-side)
//   const {
//     data: { user },
//   } = await supabaseServer.auth.getUser()

//   if (!user) {
//     redirect("/login")
//   }

//   // 2️⃣ Fetch profile with role
//   const { data: profile, error } = await supabaseServer
//     .from("profiles")
//     .select("id, full_name, role, district_id, campus_id, created_at")
//     .eq("id", user.id)
//     .single()

//   if (error || !profile) {
//     console.error("❌ Profile fetch error or not found");
//     redirect("/login")
//   }

//   const typedProfile = profile as UserProfile

//   return (
//     // Use flex h-screen to make the layout fill the window
//     <div className="flex h-screen bg-slate-50 overflow-hidden">

//       {/* 1. Sidebar - Passes the real role from the database */}
//       <Sidebar role={typedProfile.role} />

//       {/* 2. Main Content Wrapper */}
//       <div className="flex-1 flex flex-col min-w-0">

//         {/* 3. Persistent Header (The Black Bar) */}
//         <div className="p-4 pb-0">
//           <DashboardHeader />
//         </div>

//         {/* 4. Scrollable Page Content */}
//         <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
//           {/* Optional: Breadcrumbs or role info can go here */}
//           {children}
//         </main>
//       </div>
//     </div>
//   )
// }


import { redirect } from "next/navigation"
import { ReactNode } from "react"
import { createClient } from "@/lib/supabase/server"
import { UserProfile } from "@/types/user"
import AppShell from "./AppShell"

export default async function AppLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabaseServer = await createClient()

  const { data: { user } } = await supabaseServer.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile, error } = await supabaseServer
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single()

  if (error || !profile) redirect("/login")

  const typedProfile = profile as UserProfile

  return (
    <AppShell role={typedProfile.role}>
      {children}
    </AppShell>
  )
}
