import type { ReactNode } from "react"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { requireUser } from "@/lib/auth/dal"
import { demoMode } from "@/lib/supabase/config"
import Loading from "./loading"

// Gate every signed-in app page on completed onboarding so incomplete
// students land on the dedicated /onboarding flow instead of a partial
// dashboard. Transient Supabase errors fall through so pages can render
// their own error states. Demo mode previews the dashboard without this
// gate. /onboarding itself lives outside this layout, so there is no
// redirect loop.
//
// Cache Components (next.config.ts) requires session reads to sit behind
// a <Suspense> boundary — cookies() at the top of a layout is a build
// error, so this lives in a child component that streams in.
async function OnboardingGate({ children }: { children: ReactNode }) {
  const { user, supabase } = await requireUser()

  if (!demoMode) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!error && !profile?.onboarding_completed_at) {
      redirect("/onboarding")
    }
  }

  return <>{children}</>
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <Suspense fallback={<Loading />}>
        <OnboardingGate>{children}</OnboardingGate>
      </Suspense>
    </AppShell>
  )
}
