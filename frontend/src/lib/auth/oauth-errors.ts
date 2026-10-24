const DEFAULT_OAUTH_ERROR =
  "Could not sign in with Google. Please try again, or use your email and password."

export function friendlyOAuthError(raw: string | null | undefined): string {
  if (!raw) {
    return DEFAULT_OAUTH_ERROR
  }

  const lower = raw.toLowerCase()

  if (
    lower.includes("access_denied") ||
    lower.includes("cancel") ||
    lower.includes("denied")
  ) {
    return "Google sign-in was cancelled or denied. Try again, or use your email and password."
  }
  if (lower.includes("provider") && lower.includes("not")) {
    return "Google sign-in is not enabled for this project yet. Enable the Google provider in your Supabase dashboard under Authentication → Providers."
  }
  if (lower.includes("email")) {
    return "Could not finish signing in with Google. Check that your Google account has an email address, then try again."
  }
  if (lower.includes("database") || lower.includes("rate limit")) {
    return "Could not save your account right now. Please try again in a moment."
  }

  return DEFAULT_OAUTH_ERROR
}
