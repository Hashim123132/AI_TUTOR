import { FlameIcon, GaugeIcon, TargetIcon, TimerIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatMinutes } from "@/lib/format"
import type { ProgressSummary } from "@/lib/types"

function StatCard({
  icon,
  label,
  value,
  hint,
  progress,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint: string
  progress?: { percent: number; label: string }
}) {
  return (
    <Card>
      <CardContent className="gap-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
            {icon}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        {progress ? (
          <Progress value={progress.percent} label={progress.label} className="mt-1" />
        ) : null}
      </CardContent>
    </Card>
  )
}

export function ProgressSummaryCards({ summary }: { summary: ProgressSummary }) {
  const masteryPercent =
    summary.topicsTotal > 0
      ? Math.round((summary.topicsMastered / summary.topicsTotal) * 100)
      : 0
  const studyPercent =
    summary.weeklyGoalMinutes > 0
      ? Math.round((summary.studyMinutesThisWeek / summary.weeklyGoalMinutes) * 100)
      : 0
  const hasQuizHistory =
    summary.averageQuizScorePercent > 0 || summary.quizScoreTrendPercent !== 0

  return (
    <section aria-label="Progress summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={<TargetIcon aria-hidden="true" className="size-4" />}
        label="Topics mastered"
        value={`${summary.topicsMastered}/${summary.topicsTotal}`}
        hint={
          summary.topicsTotal > 0
            ? `${masteryPercent}% of your current syllabus`
            : "Topics appear once your study plan generates tasks"
        }
        progress={
          summary.topicsTotal > 0
            ? { percent: masteryPercent, label: "Topics mastered" }
            : undefined
        }
      />
      <StatCard
        icon={<TimerIcon aria-hidden="true" className="size-4" />}
        label="Study time this week"
        value={formatMinutes(summary.studyMinutesThisWeek)}
        hint={`Goal: ${formatMinutes(summary.weeklyGoalMinutes)}`}
        progress={
          summary.weeklyGoalMinutes > 0
            ? { percent: studyPercent, label: "Weekly study goal" }
            : undefined
        }
      />
      <StatCard
        icon={<GaugeIcon aria-hidden="true" className="size-4" />}
        label="Average quiz score"
        value={hasQuizHistory ? `${summary.averageQuizScorePercent}%` : "—"}
        hint={
          hasQuizHistory
            ? `${summary.quizScoreTrendPercent >= 0 ? "+" : ""}${summary.quizScoreTrendPercent}% vs last week`
            : "No quiz history yet"
        }
      />
      <StatCard
        icon={<FlameIcon aria-hidden="true" className="size-4" />}
        label="Study streak"
        value={`${summary.streakDays} days`}
        hint="Keep the momentum going"
      />
    </section>
  )
}
