import { createBrowserClient, createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client (Client Components)
export const supabaseBrowser = () =>
  createBrowserClient(supabaseUrl, supabaseAnonKey)

// Server client (Server Components, Route Handlers)
export async function supabaseServer() {
    const cookieStore = await cookies()
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
