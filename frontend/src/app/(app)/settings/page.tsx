import type { Metadata } from "next"
import { AiProviderSettings } from "@/components/settings/ai-provider-settings"
import { PageHeader } from "@/components/ui/page-header"
import { requireUser } from "@/lib/auth/dal"
import {
  DEFAULT_AI_PROVIDER,
  isAiProvider,
} from "@/lib/settings/constants"

export const metadata: Metadata = { title: "Settings" }

export default async function SettingsPage() {
  const { user, supabase } = await requireUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_provider")
    .eq("user_id", user.id)
    .maybeSingle()

  const stored = (profile as { ai_provider?: string | null } | null)
    ?.ai_provider
  const provider = isAiProvider(stored) ? stored : DEFAULT_AI_PROVIDER

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Manage how your AI tutor answers your questions."
      />
      <AiProviderSettings initialProvider={provider} />
    </div>
  )
}
