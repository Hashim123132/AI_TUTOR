import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { requireUser } from "@/lib/auth/dal"
import { demoMode } from "@/lib/supabase/config"

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, supabase } = await requireUser()

  // Gate every signed-in app page on completed onboarding so incomplete
  // students land on the dedicated /onboarding flow instead of a partial
  // dashboard. Transient Supabase errors fall through so pages can render
  // their own error states. Demo mode previews the dashboard without this
  // gate. /onboarding itself lives outside this layout, so there is no
  // redirect loop.
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

  return <AppShell>{children}</AppShell>
}
