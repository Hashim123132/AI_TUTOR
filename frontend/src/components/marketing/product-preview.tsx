import {
  CircleCheckIcon,
  CircleIcon,
  GraduationCapIcon,
  LoaderCircleIcon,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { navItems } from "@/components/layout/nav-config"
import { cn } from "@/lib/utils"

const previewTasks = [
  {
    title: "Review gradient descent notes",
    meta: "Machine Learning · Optimization · 25 min",
    time: "9:00 AM",
    status: "completed" as const,
  },
  {
    title: "Watch: Eigenvectors explained",
    meta: "Calculus II · Linear algebra · 15 min",
    time: "2:00 PM",
    status: "in_progress" as const,
  },
  {
    title: "Quiz: Binary search trees",
    meta: "Data Structures · Trees · 20 min",
    time: "5:30 PM",
    status: "pending" as const,
  },
  {
    title: "Practice: Chain rule problems",
    meta: "Calculus II · Differentiation · 35 min",
    time: "7:00 PM",
    status: "pending" as const,
  },
]

const weekBars = [
  { day: "Mon", minutes: 75 },
  { day: "Tue", minutes: 50 },
  { day: "Wed", minutes: 95, isToday: true },
  { day: "Thu", minutes: 80 },
  { day: "Fri", minutes: 45 },
  { day: "Sat", minutes: 60 },
  { day: "Sun", minutes: 0 },
]

const subjectMastery = [
  { subject: "Data Structures", percent: 74 },
  { subject: "Machine Learning", percent: 62 },
  { subject: "Calculus II", percent: 41 },
]

const maxWeekMinutes = 95

function TaskStatusIcon({ status }: { status: "completed" | "in_progress" | "pending" }) {
  if (status === "completed") {
    return <CircleCheckIcon aria-hidden="true" className="size-4 text-emerald-600" />
  }
  if (status === "in_progress") {
    return <LoaderCircleIcon aria-hidden="true" className="size-4 text-brand" />
  }
  return <CircleIcon aria-hidden="true" className="size-4 text-muted-foreground/40" />
}

export function ProductPreview() {
  return (
    <figure className="mx-auto mt-16 max-w-5xl lg:mt-20">
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-black/[0.04] ring-1 ring-foreground/[0.06]"
      >
        <div className="flex">
          <aside className="hidden w-48 shrink-0 flex-col border-r bg-sidebar sm:flex">
            <div className="flex h-11 items-center gap-2 border-b px-3.5">
              <span className="flex size-6 items-center justify-center rounded-md bg-brand text-brand-foreground">
                <GraduationCapIcon className="size-3.5" />
              </span>
              <span className="text-[13px] font-semibold tracking-tight">
                AI Learning Tutor
              </span>
            </div>
            <nav className="flex flex-1 flex-col gap-0.5 p-2">
              {navItems.map((item, index) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]",
                      index === 0
                        ? "bg-background font-medium text-foreground shadow-xs"
                        : "text-muted-foreground"
                    )}
                  >
                    <Icon aria-hidden="true" className="size-3.5" />
                    {item.label}
                  </div>
                )
              })}
            </nav>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex h-11 items-center justify-between border-b px-4">
              <p className="text-[13px] font-medium tracking-tight">Dashboard</p>
              <span className="flex size-6 items-center justify-center rounded-full bg-brand/10 text-[10px] font-semibold text-brand">
                A
              </span>
            </div>

            <div className="space-y-4 bg-background p-4 sm:p-5">
              <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-base font-semibold tracking-tight">
                    Welcome back, Amara
                  </p>
                  <p className="mt-1 truncate text-[13px] text-muted-foreground">
                    Ace the machine learning exam and finish the calculus
                    problem sets
                  </p>
                </div>
                <span className="w-fit shrink-0 rounded-md border border-brand/20 bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
                  Finals in 6 weeks
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border bg-card p-3.5">
                  <p className="text-xs text-muted-foreground">
                    Topics mastered
                  </p>
                  <p className="mt-1 text-xl font-semibold tracking-tight">
                    12
                    <span className="text-sm font-medium text-muted-foreground">
                      /32
                    </span>
                  </p>
                  <Progress
                    value={37.5}
                    label="Topics mastered"
                    className="mt-2.5 h-1.5"
                  />
                </div>
                <div className="rounded-lg border bg-card p-3.5">
                  <p className="text-xs text-muted-foreground">
                    Study time this week
                  </p>
                  <p className="mt-1 text-xl font-semibold tracking-tight">
                    5h 40m
                  </p>
                  <Progress
                    value={57}
                    label="Weekly study goal"
                    className="mt-2.5 h-1.5"
                  />
                </div>
                <div className="rounded-lg border bg-card p-3.5">
                  <p className="text-xs text-muted-foreground">
                    Average quiz score
                  </p>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <p className="text-xl font-semibold tracking-tight">78%</p>
                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                      +6%
                    </span>
                  </div>
                  <p className="mt-2.5 text-[11px] text-muted-foreground">
                    vs last week
                  </p>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-5">
                <div className="rounded-lg border bg-card p-3.5 lg:col-span-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-semibold tracking-tight">
                      Today&apos;s tasks
                    </p>
                    <span className="rounded-md border px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      1/4 done
                    </span>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {previewTasks.map((task) => (
                      <li
                        key={task.title}
                        className="flex items-start gap-2.5 rounded-md border bg-background p-2.5"
                      >
                        <span className="mt-0.5 shrink-0">
                          <TaskStatusIcon status={task.status} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate text-[13px] font-medium",
                              task.status === "completed" &&
                                "text-muted-foreground line-through"
                            )}
                          >
                            {task.title}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            {task.meta}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {task.time}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3 lg:col-span-2">
                  <div className="rounded-lg border bg-card p-3.5">
                    <p className="text-[13px] font-semibold tracking-tight">
                      This week
                    </p>
                    <div className="mt-3 flex h-20 items-end gap-1.5">
                      {weekBars.map((bar) => (
                        <div
                          key={bar.day}
                          className="flex h-full flex-1 flex-col items-center gap-1.5"
                        >
                          <div className="flex w-full flex-1 items-end rounded-sm bg-muted">
                            <div
                              className={cn(
                                "w-full rounded-sm",
                                bar.isToday ? "bg-brand" : "bg-brand/30"
                              )}
                              style={{
                                height: `${Math.round((bar.minutes / maxWeekMinutes) * 100)}%`,
                              }}
                            />
                          </div>
                          <span
                            className={cn(
                              "text-[10px]",
                              bar.isToday
                                ? "font-medium text-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            {bar.day}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border bg-card p-3.5">
                    <p className="text-[13px] font-semibold tracking-tight">
                      Subject mastery
                    </p>
                    <ul className="mt-3 space-y-2.5">
                      {subjectMastery.map((item) => (
                        <li key={item.subject}>
                          <div className="flex items-center justify-between gap-2 text-[12px]">
                            <span className="truncate font-medium">
                              {item.subject}
                            </span>
                            <span className="shrink-0 tabular-nums text-muted-foreground">
                              {item.percent}%
                            </span>
                          </div>
                          <Progress
                            value={item.percent}
                            label={`${item.subject} mastery`}
                            className="mt-1.5 h-1.5"
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <figcaption className="sr-only">
        Preview of the AI Learning Tutor dashboard showing a personalized
        study plan for today, weekly study progress, average quiz scores, and
        subject mastery.
      </figcaption>
    </figure>
  )
}
