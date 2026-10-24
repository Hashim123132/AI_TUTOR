import type { Metadata } from "next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SignupForm } from "@/components/auth/signup-form"
import { isSupabaseConfigured } from "@/lib/supabase/config"

export const metadata: Metadata = { title: "Create account" }

export default function SignupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Create your account</CardTitle>
        <CardDescription>
          Set up your tutor profile in a few quick steps.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSupabaseConfigured ? (
          <SignupForm />
        ) : (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Sign-up is unavailable because Supabase is not configured.
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
