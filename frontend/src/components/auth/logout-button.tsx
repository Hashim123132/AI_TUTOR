import { LogOutIcon } from "lucide-react"
import { logoutAction } from "@/lib/auth/actions"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
      >
        <LogOutIcon aria-hidden="true" className="size-4" />
        Sign out
      </Button>
    </form>
  )
}
