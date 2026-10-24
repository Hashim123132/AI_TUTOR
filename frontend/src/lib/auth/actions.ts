"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { validateCredentials } from "@/lib/onboarding/validation"

export type AuthFormState = {
  error?: string
  message?: string
} | null

const NOT_CONFIGURED_ERROR =
  "Sign-in is unavailable because Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to frontend/.env.local (see frontend/.env.local.example)."

function firstError(errors: Record<string, string | undefined>): string | undefined {
  return Object.values(errors).find(Boolean)
}

function friendlyAuthError(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes("invalid login credentials")) {
    return "Incorrect email or password."
  }
  if (lower.includes("email not confirmed")) {
    return "Confirm your email address before signing in."
  }
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "An account with this email already exists. Sign in instead."
  }
  if (lower.includes("password")) {
    return "Password must be at least 8 characters."
  }
  return "Something went wrong. Please try again."
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")

  const errors = validateCredentials(email, password)
  const problem = firstError(errors)
  if (problem) {
    return { error: problem }
  }

  if (!isSupabaseConfigured) {
    return { error: NOT_CONFIGURED_ERROR }
  }

  const supabase = await createSupabaseServerClient()

  let userId: string
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      return { error: friendlyAuthError(error.message) }
    }
    userId = data.user.id
  } catch {
    return { error: "Could not reach the sign-in service. Try again shortly." }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("user_id", userId)
    .maybeSingle()

  redirect(profile?.onboarding_completed_at ? "/dashboard" : "/onboarding")
}

export async function signupAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const confirmPassword = String(formData.get("confirm_password") ?? "")

  const errors = validateCredentials(email, password)
  if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match."
  }
  const problem = firstError(errors)
  if (problem) {
    return { error: problem }
  }

  if (!isSupabaseConfigured) {
    return { error: NOT_CONFIGURED_ERROR }
  }

  const supabase = await createSupabaseServerClient()

  try {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      return { error: friendlyAuthError(error.message) }
    }
    if (data.session) {
      redirect("/onboarding")
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error
    }
    return { error: "Could not reach the sign-up service. Try again shortly." }
  }

  return {
    message: "Check your inbox to confirm your email address, then sign in.",
  }
}

async function getAppOrigin(): Promise<string> {
  const headerStore = await headers()
  const origin = headerStore.get("origin")
  if (origin) {
    return origin
  }
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host")
  if (host) {
    const protocol = headerStore.get("x-forwarded-proto") ?? "http"
    return `${protocol}://${host}`
  }
  return "http://localhost:3000"
}

export async function signInWithGoogleAction(
  _prev: AuthFormState,
  _formData: FormData
): Promise<AuthFormState> {
  if (!isSupabaseConfigured) {
    return { error: NOT_CONFIGURED_ERROR }
  }

  const supabase = await createSupabaseServerClient()

  try {
    const origin = await getAppOrigin()
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/dashboard")}`

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    })

    if (error) {
      return { error: friendlyAuthError(error.message) }
    }

    if (data.url) {
      redirect(data.url)
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error
    }
    return { error: "Could not start Google sign-in. Try again shortly." }
  }

  return { error: "Could not start Google sign-in. Try again shortly." }
}

export async function logoutAction(): Promise<void> {
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient()
    try {
      await supabase.auth.signOut()
    } catch {
      // Signing out locally still clears cookies below.
    }
  }
  redirect("/login")
}

function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  )
}
