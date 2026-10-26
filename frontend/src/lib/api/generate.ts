import "server-only"
import { apiUrl } from "@/lib/supabase/config"

export type GenerateResult =
  | { kind: "ok"; text: string; provider: string }
  | { kind: "unauthorized" }
  | { kind: "error"; message: string; provider?: string }

const FETCH_TIMEOUT_MS = 60_000

type BackendErrorDetail = {
  code?: string
  message?: string
  provider?: string
  provider_label?: string
}

function isDetailObject(value: unknown): value is BackendErrorDetail {
  return typeof value === "object" && value !== null
}

export async function generateAnswer(
  accessToken: string | null,
  prompt: string,
  maxNewTokens?: number
): Promise<GenerateResult> {
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

  const endpoint = `${apiUrl.replace(/\/+$/, "")}/api/generate`

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        typeof maxNewTokens === "number"
          ? { prompt, max_new_tokens: maxNewTokens }
          : { prompt }
      ),
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })

    if (response.status === 401) {
      return { kind: "unauthorized" }
    }

    if (!response.ok) {
      let detail: BackendErrorDetail = {}
      try {
        const payload = (await response.json()) as {
          detail?: unknown
        }
        if (isDetailObject(payload.detail)) {
          detail = payload.detail
        }
      } catch {
        // Non-JSON error body; fall through to the status message.
      }

      const base =
        detail.message ??
        `The tutor service returned an unexpected status (${response.status}).`
      const label = detail.provider_label
      return {
        kind: "error",
        message: label ? `${base} Provider: ${label}.` : base,
        provider: detail.provider,
      }
    }

    const data = (await response.json()) as {
      generated_text?: string
      provider?: string
    }

    if (typeof data.generated_text !== "string" || !data.generated_text.trim()) {
      return {
        kind: "error",
        message: "The tutor returned an empty answer. Try again.",
      }
    }

    return {
      kind: "ok",
      text: data.generated_text,
      provider: data.provider ?? "teacher_shneela",
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return {
        kind: "error",
        message: "The tutor took too long to respond. Try again.",
      }
    }
    return {
      kind: "error",
      message:
        "Could not reach the tutor service. Check that the backend is running and NEXT_PUBLIC_API_URL points at it.",
    }
  }
}
