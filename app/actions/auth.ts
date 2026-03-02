'use server'

import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
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

export async function signInWithMagicLink(email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) {
    throw new Error("Email is required")
  }

  const supabase = await createClient()
  const requestHeaders = await headers()
  const forwardedProto = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim()
  const host = (requestHeaders.get("x-forwarded-host") || requestHeaders.get("host"))?.split(",")[0]?.trim()
  const isLocalHost = Boolean(host && (host.includes("localhost") || host.startsWith("127.0.0.1")))
  const inferredProto = forwardedProto || (isLocalHost ? "http" : "https")
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (host ? `${inferredProto}://${host}` : "http://localhost:3000")
  const emailRedirectTo = `${siteUrl}/auth/callback?next=/dashboard`

  if (process.env.NODE_ENV !== "production") {
    console.info("[auth] magic-link redirect", { emailRedirectTo, host, forwardedProto })
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}
