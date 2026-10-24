import type { Metadata } from "next"
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

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Welcome back</CardTitle>
        <CardDescription>
          Sign in to continue your study plan.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
