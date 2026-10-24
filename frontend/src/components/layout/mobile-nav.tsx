"use client"

import { useState } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { MenuIcon, XIcon } from "lucide-react"
import { ApiStatusBadge } from "@/components/layout/api-status-badge"
import { BrandMark } from "@/components/layout/sidebar"
import { NavList } from "@/components/layout/nav-list"
import { LogoutButton } from "@/components/auth/logout-button"
import { Button } from "@/components/ui/button"

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur md:hidden">
      <BrandMark />

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger
          render={
            <Button variant="outline" size="icon-sm" aria-label="Open navigation menu">
              <MenuIcon />
            </Button>
          }
        />

        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50" />
          <Dialog.Popup className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-sidebar text-sidebar-foreground shadow-xl outline-none">
            <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
              <Dialog.Title className="text-sm font-semibold">
                Navigation
              </Dialog.Title>
              <Dialog.Close
                render={
                  <Button variant="ghost" size="icon-sm" aria-label="Close navigation menu">
                    <XIcon />
                  </Button>
                }
              />
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4">
              <NavList onNavigate={() => setOpen(false)} />
            </div>

            <div className="shrink-0 space-y-1 border-t p-3">
              <ApiStatusBadge />
              <LogoutButton />
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </header>
  )
}
