"use server"

import { requireUser } from "@/lib/auth/dal"
import {
  isAiProvider,
  type AiProvider,
} from "@/lib/settings/constants"

export type SaveAiProviderResult =
  | { ok: true; provider: AiProvider }
  | { ok: false; message: string }

export async function saveAiProvider(
  _prevState: SaveAiProviderResult | null,
  formData: FormData
): Promise<SaveAiProviderResult> {
  const provider = formData.get("provider")

  if (!isAiProvider(provider)) {
    return { ok: false, message: "Choose a valid AI provider." }
  }

  const { user, supabase } = await requireUser()

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profileError) {
    return { ok: false, message: "Could not save your preference. Try again." }
  }

  if (!profile) {
    return {
      ok: false,
      message: "Finish onboarding before changing your AI provider.",
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ ai_provider: provider })
    .eq("user_id", user.id)

  if (error) {
    return { ok: false, message: "Could not save your preference. Try again." }
  }

  return { ok: true, provider }
}
