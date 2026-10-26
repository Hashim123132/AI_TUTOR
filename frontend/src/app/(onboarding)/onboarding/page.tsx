import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { requireUser } from "@/lib/auth/dal"
import { PROFILE_COLUMNS, rowToOnboardingData, type ProfileRow, type SubjectRow } from "@/lib/onboarding/draft"
import { TOTAL_STEPS } from "@/lib/onboarding/constants"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"

export const metadata: Metadata = { title: "Set up your profile" }

export default async function OnboardingPage() {
  const { user, supabase } = await requireUser()

  const [{ data: profile }, { data: subjects }] = await Promise.all([
    supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("subjects")
      .select("id, name, level, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true }),
  ])

  const profileRow = (profile ?? null) as ProfileRow | null
  if (profileRow?.onboarding_completed_at) {
    redirect("/dashboard")
  }

  const initialData = rowToOnboardingData(
    profileRow,
    (subjects ?? []) as SubjectRow[]
  )
  const initialStep = Math.min(
    Math.max(profileRow?.current_step ?? 1, 1),
    TOTAL_STEPS
  )

  return (
    <OnboardingWizard initialData={initialData} initialStep={initialStep} />
  )
}
