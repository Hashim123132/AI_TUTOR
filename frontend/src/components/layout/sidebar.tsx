import { GraduationCapIcon } from "lucide-react"
import Link from "next/link"
import { ApiStatusBadge } from "@/components/layout/api-status-badge"
import { NavList } from "@/components/layout/nav-list"
import { LogoutButton } from "@/components/auth/logout-button"

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b px-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
          <GraduationCapIcon aria-hidden="true" className="size-4.5" />
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight">AI Learning Tutor</span>
          <span className="text-xs text-muted-foreground">Adaptive study companion</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavList />
      </div>

      <div className="shrink-0 space-y-1 border-t p-3">
        <ApiStatusBadge />
        <LogoutButton />
      </div>
    </aside>
  )
}

export function BrandMark() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
        <GraduationCapIcon aria-hidden="true" className="size-4.5" />
      </span>
      <span className="text-sm font-semibold">AI Learning Tutor</span>
    </Link>
  )
}
