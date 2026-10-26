import type { ReactNode } from "react"
import { GraduationCapIcon } from "lucide-react"

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      <header className="flex items-center justify-center py-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-brand-foreground">
            <GraduationCapIcon aria-hidden="true" className="size-5" />
          </span>
          <span className="text-base font-semibold">AI Learning Tutor</span>
        </div>
      </header>

      <main
        id="main-content"
        className="flex flex-1 flex-col items-center justify-center px-4 pb-12"
      >
        <div className="w-full max-w-2xl">{children}</div>
      </main>
    </div>
  )
}
