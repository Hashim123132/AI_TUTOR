"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"
import {
  Loader2Icon,
  MessagesSquareIcon,
  RefreshCwIcon,
  SendIcon,
  SettingsIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { askTutor } from "@/lib/tutor/actions"
import {
  providerLabel,
  type AiProvider,
} from "@/lib/settings/constants"
import { cn } from "@/lib/utils"

type ChatMessage =
  | { id: string; role: "user"; content: string }
  | {
      id: string
      role: "assistant"
      content: string
      provider: string
    }

type Props = {
  initialProvider: AiProvider
}

export function TutorChat({ initialProvider }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [lastPrompt, setLastPrompt] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const list = listRef.current
    if (list) {
      list.scrollTop = list.scrollHeight
    }
  }, [messages, isPending, error])

  function runAsk(prompt: string) {
    setError(null)
    startTransition(async () => {
      const result = await askTutor(prompt)

      if (result.ok) {
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: result.text,
            provider: result.provider,
          },
        ])
        return
      }

      setError(result.message)
    })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const prompt = String(formData.get("prompt") ?? "").trim()

    if (!prompt || isPending) return

    event.currentTarget.reset()
    setLastPrompt(prompt)
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content: prompt },
    ])
    runAsk(prompt)
  }

  function handleRetry() {
    if (!lastPrompt || isPending) return
    runAsk(lastPrompt)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/30 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Answers by{" "}
          <span className="font-medium text-foreground">
            {providerLabel(initialProvider)}
          </span>
          . You can switch providers in Settings.
        </p>
        <Button
          render={<Link href="/settings" />}
          variant="outline"
          size="sm"
          className="gap-1.5"
        >
          <SettingsIcon aria-hidden="true" />
          Settings
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          {messages.length === 0 && !isPending && !error ? (
            <EmptyState
              icon={<MessagesSquareIcon aria-hidden="true" />}
              title="Ask your tutor anything"
              description="Type a question below. Your saved AI provider will answer step by step."
            />
          ) : (
            <div
              ref={listRef}
              className="flex max-h-[28rem] flex-col gap-3 overflow-y-auto pr-1"
              aria-live="polite"
            >
              {messages.map((message) =>
                message.role === "user" ? (
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm text-primary-foreground sm:max-w-[75%]">
                      <p className="whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div key={message.id} className="flex justify-start">
                    <div className="max-w-[90%] rounded-xl rounded-bl-sm border bg-muted/40 px-3.5 py-2.5 text-sm sm:max-w-[80%]">
                      <div className="mb-1.5">
                        <Badge variant="brand">
                          {providerLabel(message.provider)}
                        </Badge>
                      </div>
                      <p className="whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>
                  </div>
                )
              )}

              {isPending ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
                  Thinking…
                </div>
              ) : null}
            </div>
          )}

          {error ? (
            <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-3">
              <p className="text-sm font-medium text-destructive">{error}</p>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  disabled={isPending || !lastPrompt}
                  className="gap-1.5"
                >
                  <RefreshCwIcon aria-hidden="true" />
                  Try again
                </Button>
              </div>
            </div>
          ) : null}

          <form
            onSubmit={handleSubmit}
            className={cn(
              "flex items-center gap-2",
              isPending && "opacity-70"
            )}
          >
            <Input
              name="prompt"
              placeholder="Ask a question…"
              maxLength={1024}
              autoComplete="off"
              disabled={isPending}
              aria-label="Your question"
            />
            <Button
              type="submit"
              disabled={isPending}
              aria-label="Send question"
              size="icon"
            >
              {isPending ? (
                <Loader2Icon aria-hidden="true" className="animate-spin" />
              ) : (
                <SendIcon aria-hidden="true" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
