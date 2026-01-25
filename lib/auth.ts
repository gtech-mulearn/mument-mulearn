import { supabaseServer } from "./supabase"

export async function getUser() {
  const supabase = supabaseServer()
  const { data } = await supabase.auth.getUser()
  return data?.user ?? null
}

export async function requireUser() {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")
  return user
}
