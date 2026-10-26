"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { CheckIcon, Loader2Icon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { saveAiProvider } from "@/lib/settings/actions"
import { AI_PROVIDER_OPTIONS, type AiProvider } from "@/lib/settings/constants"
import { cn } from "@/lib/utils"

type SaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string }

type Props = {
  initialProvider: AiProvider
}

export function AiProviderSettings({ initialProvider }: Props) {
  const [savedProvider, setSavedProvider] =
    useState<AiProvider>(initialProvider)
  const [selected, setSelected] = useState<AiProvider>(initialProvider)
  const [status, setStatus] = useState<SaveStatus>({ kind: "idle" })
  const [isPending, startTransition] = useTransition()
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current)
    }
  }, [])

  function handleChange(next: AiProvider) {
    if (next === savedProvider || isPending) return

    setSelected(next)
    setStatus({ kind: "saving" })
    if (savedTimer.current) clearTimeout(savedTimer.current)

    const formData = new FormData()
    formData.set("provider", next)

    startTransition(async () => {
      const result = await saveAiProvider(null, formData)

      if (result.ok) {
        setSavedProvider(result.provider)
        setSelected(result.provider)
        setStatus({ kind: "saved" })
        savedTimer.current = setTimeout(() => {
          setStatus({ kind: "idle" })
        }, 2500)
        return
      }

      setSelected(savedProvider)
      setStatus({ kind: "error", message: result.message })
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>AI Provider</CardTitle>
          <Badge variant="brand">
            {AI_PROVIDER_OPTIONS.find(
              (option) => option.value === savedProvider
            )?.label ?? savedProvider}
          </Badge>
        </div>
        <CardDescription>
          Choose which AI answers your questions in the AI Tutor. Your
          preference is saved to your account and used on every request.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div
          role="radiogroup"
          aria-label="AI provider"
          className="grid gap-3 sm:grid-cols-2"
        >
          {AI_PROVIDER_OPTIONS.map((option) => {
            const isSelected = selected === option.value
            const isSaved = savedProvider === option.value

            return (
              <label
                key={option.value}
                className={cn(
                  "relative flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-colors outline-none",
                  "hover:border-ring/40 hover:bg-muted/40",
                  "peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "bg-background",
                  isPending && "cursor-not-allowed opacity-60"
                )}
              >
                <input
                  type="radio"
                  name="ai-provider"
                  value={option.value}
                  checked={isSelected}
                  onChange={() => handleChange(option.value)}
                  disabled={isPending}
                  className="peer sr-only"
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{option.label}</span>
                  {isSaved ? (
                    <Badge variant="success">
                      <CheckIcon aria-hidden="true" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline">{option.badge}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              </label>
            )
          })}
        </div>

        <div aria-live="polite" className="min-h-5">
          {status.kind === "saving" || isPending ? (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Loader2Icon aria-hidden="true" className="size-3.5 animate-spin" />
              Saving your preference…
            </p>
          ) : status.kind === "saved" ? (
            <p className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckIcon aria-hidden="true" className="size-3.5" />
              Saved. New answers will use this provider.
            </p>
          ) : status.kind === "error" ? (
            <p className="text-sm font-medium text-destructive">
              {status.message}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
