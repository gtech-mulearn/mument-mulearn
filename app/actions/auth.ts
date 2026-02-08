'use server'

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function signOut() {
  const supabase = await createClient()
  
  try {
    await supabase.auth.signOut()
    redirect('/login')
  } catch (error) {
    throw new Error("Failed to sign out")
  }
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient()

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  return { success: true, data }
}
