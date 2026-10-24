"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Loader2Icon } from "lucide-react"
import { signupAction, type AuthFormState } from "@/lib/auth/actions"
import { Button } from "@/components/ui/button"
import { FieldError, Input } from "@/components/ui/input"

export function SignupForm() {
  const [state, formAction, isPending] = useActionState<
    AuthFormState,
    FormData
  >(signupAction, null)

  return (
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
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="At least 8 characters"
          disabled={isPending}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirm_password" className="text-sm font-medium">
          Confirm password
        </label>
        <Input
          id="confirm_password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Repeat your password"
          disabled={isPending}
        />
        <FieldError id="confirm-password-error" message={state?.error} />
      </div>

      {state?.message ? (
        <p
          role="status"
          className="rounded-lg border border-border bg-muted/50 px-3.5 py-2.5 text-sm text-foreground"
        >
          {state.message}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  )
}
