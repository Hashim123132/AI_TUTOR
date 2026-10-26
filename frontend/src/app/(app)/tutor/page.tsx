import type { Metadata } from "next"
import { PageHeader } from "@/components/ui/page-header"
import { TutorChat } from "@/components/tutor/tutor-chat"
import { requireUser } from "@/lib/auth/dal"
import {
  DEFAULT_AI_PROVIDER,
  isAiProvider,
} from "@/lib/settings/constants"

export const metadata: Metadata = { title: "AI Tutor" }

export default async function TutorPage() {
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
        title="AI Tutor"
        description="Ask questions and get step-by-step answers from your chosen AI provider."
      />
      <TutorChat initialProvider={provider} />
    </div>
  )
}
