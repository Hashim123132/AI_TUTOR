import Link from "next/link"
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button"
import { Button } from "@/components/ui/button"

export function FinalCta() {
  return (
    <section className="border-t py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Start learning with a plan that adapts to you
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
            Create your account and get a personalized study plan built around
            your goals and schedule.
          </p>

          <div className="mt-8 flex justify-center">
            <Button
              render={<Link href="/signup" />}
              className="h-11 px-6 text-[0.9375rem]"
            >
              Start learning for free
            </Button>
          </div>

          <div className="mx-auto mt-4 w-full max-w-xs">
            <GoogleSignInButton />
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Already learning?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
