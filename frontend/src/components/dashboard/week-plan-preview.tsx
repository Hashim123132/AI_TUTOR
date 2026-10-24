import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMinutes } from "@/lib/format"
import type { DayPlan } from "@/lib/types"

export function WeekPlanPreview({ week }: { week: DayPlan[] }) {
  const maxMinutes = Math.max(...week.map((day) => day.totalMinutes), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">This week&apos;s plan</CardTitle>
        <CardDescription>
          Your scheduled study load for each day. Open the Study Plan page for the full
          breakdown.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          {week.map((day) => {
            const barHeight = day.totalMinutes === 0 ? 0 : Math.max(12, Math.round((day.totalMinutes / maxMinutes) * 48))
            return (
              <li
                key={day.day}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border p-3 text-center",
                  day.isToday && "border-brand/40 bg-brand/5"
                )}
              >
                <span
                  className={cn(
                    "text-xs font-medium",
                    day.isToday ? "text-brand" : "text-muted-foreground"
                  )}
                >
                  {day.day}
                  {day.isToday ? <span className="sr-only"> (today)</span> : null}
                </span>

                <div
                  aria-hidden="true"
                  className="flex h-12 w-full items-end justify-center"
                >
                  {barHeight > 0 ? (
                    <div
                      className={cn(
                        "w-6 rounded-md",
                        day.isToday ? "bg-brand" : "bg-brand/30"
                      )}
                      style={{ height: `${barHeight}px` }}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground/60">Rest</span>
                  )}
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold tabular-nums">
                    {day.taskCount} {day.taskCount === 1 ? "task" : "tasks"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {day.totalMinutes > 0 ? formatMinutes(day.totalMinutes) : "—"}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}
