import { GraduationCapIcon } from "lucide-react"
import Link from "next/link"

export function MarketingBrand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
        <GraduationCapIcon aria-hidden="true" className="size-4.5" />
      </span>
      <span className="text-sm font-semibold tracking-tight">
        AI Learning Tutor
      </span>
    </Link>
  )
}
