import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"
import type { SupabaseClient } from "@supabase/supabase-js"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export type AuthContext = {
  user: { id: string; email: string }
  accessToken: string | null
  supabase: SupabaseClient
}

export const requireUser = cache(async (): Promise<AuthContext> => {
  if (!isSupabaseConfigured) {
    redirect("/login")
  }

  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return {
    user: { id: user.id, email: user.email ?? "" },
    accessToken: session?.access_token ?? null,
    supabase,
  }
})
