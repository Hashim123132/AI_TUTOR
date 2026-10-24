import { Suspense } from "react"
import type { Metadata } from "next"
import { friendlyOAuthError } from "@/lib/auth/oauth-errors"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoginForm } from "@/components/auth/login-form"
import { isSupabaseConfigured } from "@/lib/supabase/config"

export const metadata: Metadata = { title: "Sign in" }

type LoginPageProps = {
  searchParams: Promise<{ error?: string | string[] }>
}

async function OAuthErrorNotice({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const oauthError =
    typeof params.error === "string" && params.error ? params.error : null

  if (!oauthError) {
    return null
  }

  return (
    <p
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm font-medium text-destructive"
    >
      {friendlyOAuthError(oauthError)}
    </p>
  )
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Welcome back</CardTitle>
        <CardDescription>
          Sign in to continue your study plan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Suspense fallback={null}>
          <OAuthErrorNotice searchParams={searchParams} />
        </Suspense>

        {isSupabaseConfigured ? (
          <LoginForm />
        ) : (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Sign-in is unavailable because Supabase is not configured.
            </p>
            <p>
              Set <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
              and{" "}
              <code className="font-mono text-xs">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </code>{" "}
              in <code className="font-mono text-xs">frontend/.env.local</code>{" "}
              (copy <code className="font-mono text-xs">frontend/.env.local.example</code>)
              and restart the dev server.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
