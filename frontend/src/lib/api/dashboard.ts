import "server-only"
import { apiUrl } from "@/lib/supabase/config"
import type { DashboardData } from "@/lib/types"

export type DashboardFetchResult =
  | { kind: "ok"; data: DashboardData }
  | { kind: "onboarding_required" }
  | { kind: "unauthorized" }
  | { kind: "error"; message: string }

const FETCH_TIMEOUT_MS = 10_000

export async function fetchDashboard(
  accessToken: string | null
): Promise<DashboardFetchResult> {
  if (!apiUrl) {
    return {
      kind: "error",
      message:
        "The backend URL is not configured. Set NEXT_PUBLIC_API_URL in frontend/.env.local (see frontend/.env.local.example).",
    }
  }

  if (!accessToken) {
    return { kind: "unauthorized" }
  }

  const endpoint = `${apiUrl.replace(/\/+$/, "")}/api/dashboard`

  try {
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })

    if (response.status === 401) {
      return { kind: "unauthorized" }
    }
    if (response.status === 404) {
      return { kind: "onboarding_required" }
    }
    if (!response.ok) {
      return {
        kind: "error",
        message: `The dashboard service returned an unexpected status (${response.status}). Check that the backend is running.`,
      }
    }

    return { kind: "ok", data: (await response.json()) as DashboardData }
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return {
        kind: "error",
        message: "The dashboard service took too long to respond. Try again.",
      }
    }
    return {
      kind: "error",
      message:
        "Could not reach the dashboard service. Check that the backend is running and NEXT_PUBLIC_API_URL points at it.",
    }
  }
}
