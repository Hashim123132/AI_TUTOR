"use client"

import { ErrorState } from "@/components/ui/error-state"

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center py-12">
      <ErrorState
        title="This page hit an unexpected error"
        description={
          error.message || "Something went wrong while rendering this page."
        }
        onRetry={reset}
      />
    </div>
  )
}
