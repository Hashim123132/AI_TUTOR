"use client"

import { useCallback, useEffect, useState } from "react"
import { CircleAlertIcon, CircleCheckIcon, LoaderCircleIcon, RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ApiStatus = "checking" | "online" | "offline"

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "")

export function ApiStatusBadge({ className }: { className?: string }) {
  const [status, setStatus] = useState<ApiStatus>(API_URL ? "checking" : "offline")
  const [attempt, setAttempt] = useState(0)

  const retry = useCallback(() => {
    setStatus("checking")
    setAttempt((value) => value + 1)
  }, [])

  useEffect(() => {
    if (!API_URL) {
      return
    }

    let cancelled = false
    const controller = new AbortController()

    fetch(`${API_URL}/api/health`, { signal: controller.signal })
      .then((response) => {
        if (!cancelled) setStatus(response.ok ? "online" : "offline")
      })
      .catch(() => {
        if (!cancelled) setStatus("offline")
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [attempt])

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2",
        className
      )}
    >
      <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
        {status === "checking" ? (
          <LoaderCircleIcon aria-hidden="true" className="size-3.5 shrink-0 animate-spin" />
        ) : status === "online" ? (
          <CircleCheckIcon aria-hidden="true" className="size-3.5 shrink-0 text-emerald-600" />
        ) : (
          <CircleAlertIcon aria-hidden="true" className="size-3.5 shrink-0 text-amber-600" />
        )}
        <span className="truncate">
          {status === "checking"
            ? "Checking backend…"
            : status === "online"
              ? "Backend connected"
              : "Backend offline"}
        </span>
      </span>
      {status === "offline" ? (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Retry backend connection"
          onClick={retry}
          className="shrink-0"
        >
          <RefreshCwIcon />
        </Button>
      ) : null}
    </div>
  )
}
