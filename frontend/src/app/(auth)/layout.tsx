import Link from "next/link"
import type { ReactNode } from "react"
import { GraduationCapIcon } from "lucide-react"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-brand-foreground">
            <GraduationCapIcon aria-hidden="true" className="size-5" />
          </span>
          <span className="text-base font-semibold">AI Learning Tutor</span>
        </Link>
        {children}
      </div>
    </div>
  )
}
