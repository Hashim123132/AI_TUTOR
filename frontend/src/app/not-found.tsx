import Link from "next/link"
import { CompassIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center py-12">
      <EmptyState
        icon={<CompassIcon aria-hidden="true" />}
        title="Page not found"
        description="The page you're looking for doesn't exist or may have been moved."
      >
        <Button render={<Link href="/" />} variant="outline" size="sm">
          Back to dashboard
        </Button>
      </EmptyState>
    </div>
  )
}
