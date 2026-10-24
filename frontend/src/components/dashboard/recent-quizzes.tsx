import Link from "next/link"
import { ArrowRightIcon, ClipboardCheckIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"
import type { QuizResult } from "@/lib/types"

function scoreVariant(score: number): "success" | "warning" | "destructive" {
  if (score >= 80) return "success"
  if (score >= 60) return "warning"
  return "destructive"
}

export function RecentQuizzes({ quizzes }: { quizzes: QuizResult[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-base">Recent quizzes</CardTitle>
          <CardDescription>Your latest scores and how they trend.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="gap-4">
        {quizzes.length === 0 ? (
          <EmptyState
            icon={<ClipboardCheckIcon aria-hidden="true" />}
            title="No quizzes yet"
            description="Quizzes appear here after your first practice set. They adapt to your weak topics as you go."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {quizzes.map((quiz) => (
              <li key={quiz.id} className="flex items-center gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="truncate text-sm font-medium">{quiz.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {quiz.subject} · {quiz.completedLabel}
                  </p>
                </div>
                <Badge variant={scoreVariant(quiz.scorePercent)} className="shrink-0 tabular-nums">
                  {quiz.scorePercent}%
                </Badge>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/quizzes"
          className={cn(
            "inline-flex items-center gap-1 text-sm font-medium text-brand underline-offset-4 hover:underline",
            "mt-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          )}
        >
          View all quizzes
          <ArrowRightIcon aria-hidden="true" className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  )
}
