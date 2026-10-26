"use server"

import { generateAnswer } from "@/lib/api/generate"
import { requireUser } from "@/lib/auth/dal"

export type AskTutorResult =
  | { ok: true; text: string; provider: string }
  | { ok: false; message: string; provider?: string }

const MAX_PROMPT_LENGTH = 1024

export async function askTutor(prompt: string): Promise<AskTutorResult> {
  const trimmed = prompt.trim()

  if (!trimmed) {
    return { ok: false, message: "Type a question first." }
  }
  if (trimmed.length > MAX_PROMPT_LENGTH) {
    return {
      ok: false,
      message: `Questions are limited to ${MAX_PROMPT_LENGTH} characters.`,
    }
  }

  const { accessToken } = await requireUser()
  const result = await generateAnswer(accessToken, trimmed)

  if (result.kind === "ok") {
    return { ok: true, text: result.text, provider: result.provider }
  }
  if (result.kind === "unauthorized") {
    return {
      ok: false,
      message: "Your session expired. Sign in again to keep chatting.",
    }
  }
  return { ok: false, message: result.message, provider: result.provider }
}
