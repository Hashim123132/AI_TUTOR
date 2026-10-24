import { NextResponse, type NextRequest } from "next/server"
import { friendlyOAuthError } from "@/lib/auth/oauth-errors"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { createSupabaseServerClient } from "@/lib/supabase/server"

function safeNextPath(next: string | null): string {
  if (
    next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/\\")
  ) {
    return next
  }
  return "/dashboard"
}

function redirectToLogin(request: NextRequest, reason: string): NextResponse {
  const url = new URL("/login", request.nextUrl.origin)
  url.searchParams.set("error", friendlyOAuthError(reason))
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const next = safeNextPath(url.searchParams.get("next"))
  const oauthError =
    url.searchParams.get("error_description") ?? url.searchParams.get("error")

  if (!isSupabaseConfigured) {
    return redirectToLogin(request, "provider not enabled")
  }

  if (oauthError) {
    return redirectToLogin(request, oauthError)
  }

  if (!code) {
    return redirectToLogin(request, "missing code")
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return redirectToLogin(request, error?.message ?? "missing session")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("user_id", data.user.id)
    .maybeSingle()

  const destination = profile?.onboarding_completed_at ? next : "/onboarding"

  return NextResponse.redirect(new URL(destination, request.nextUrl.origin))
}
