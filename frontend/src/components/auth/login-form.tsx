"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Loader2Icon } from "lucide-react"
import { AuthDivider } from "@/components/auth/auth-divider"
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button"
import { loginAction, type AuthFormState } from "@/lib/auth/actions"
import { Button } from "@/components/ui/button"
import { FieldError, Input } from "@/components/ui/input"

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<
    AuthFormState,
    FormData
  >(loginAction, null)

  return (
    <div className="space-y-4">
      <GoogleSignInButton />
      <AuthDivider />

      <form action={formAction} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            disabled={isPending}
          />
          <FieldError
            id="email-error"
            message={
              state?.error?.startsWith("Enter your email") ||
              state?.error?.startsWith("Enter a valid")
                ? state.error
                : undefined
            }
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Your password"
            disabled={isPending}
          />
        </div>

        {state?.error ? (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm font-medium text-destructive"
          >
            {state.error}
          </p>
        ) : null}

        {state?.message ? (
          <p
            role="status"
            className="rounded-lg border border-border bg-muted/50 px-3.5 py-2.5 text-sm text-foreground"
          >
            {state.message}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="h-10 w-full text-[0.9375rem]"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  )
}
