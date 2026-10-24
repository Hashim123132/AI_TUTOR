import Link from "next/link"
import { MarketingBrand } from "@/components/marketing/brand"
import { Button } from "@/components/ui/button"

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <MarketingBrand />

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            render={<Link href="/login" />}
            className="h-9 px-3.5 text-sm"
          >
            Sign in
          </Button>
          <Button
            render={<Link href="/signup" />}
            className="h-9 px-4 text-sm"
          >
            Get started
          </Button>
        </div>
      </div>
    </header>
  )
}
