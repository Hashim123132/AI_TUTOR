import {
  BookOpenIcon,
  CalendarPlusIcon,
  CircleCheckIcon,
  CircleIcon,
  ClipboardCheckIcon,
  EyeIcon,
  LoaderCircleIcon,
  PencilLineIcon,
  PenLineIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"
import type { StudyTask, TaskType } from "@/lib/types"

const taskTypeMeta: Record<
  TaskType,
  { label: string; icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }> }
> = {
  read: { label: "Read", icon: BookOpenIcon },
  watch: { label: "Watch", icon: EyeIcon },
  practice: { label: "Practice", icon: PencilLineIcon },
  quiz: { label: "Quiz", icon: ClipboardCheckIcon },
  review: { label: "Review", icon: PenLineIcon },
}

function TaskRow({ task }: { task: StudyTask }) {
  const meta = taskTypeMeta[task.type]
  const TypeIcon = meta.icon

  return (
    <li className="flex items-start gap-3 rounded-lg border bg-background p-3 transition-colors hover:bg-muted/50">
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
          task.status === "completed"
            ? "text-emerald-600"
            : task.status === "in_progress"
              ? "text-brand"
              : "text-muted-foreground/50"
        )}
      >
        {task.status === "completed" ? (
          <CircleCheckIcon className="size-5" />
        ) : task.status === "in_progress" ? (
          <LoaderCircleIcon className="size-5 animate-spin" />
        ) : (
          <CircleIcon className="size-5" />
        )}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p
          className={cn(
            "text-sm font-medium",
            task.status === "completed" && "text-muted-foreground line-through"
          )}
        >
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{task.subject}</span>
          <span aria-hidden="true">·</span>
          <span>{task.topic}</span>
          <span aria-hidden="true">·</span>
          <span>{task.estimatedMinutes} min</span>
          <span aria-hidden="true">·</span>
          <span>{task.scheduledLabel}</span>
        </div>
      </div>

      <Badge variant="secondary" className="shrink-0 gap-1">
        <TypeIcon aria-hidden="true" />
        {meta.label}
      </Badge>
    </li>
  )
}

export function TaskListCard({
  title,
  description,
  tasks,
}: {
  title: string
  description: string
  tasks: StudyTask[]
}) {
  const completedCount = tasks.filter((task) => task.status === "completed").length

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {completedCount > 0 ? (
          <Badge variant="outline" className="shrink-0">
            {completedCount}/{tasks.length} done
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <EmptyState
            icon={<CalendarPlusIcon aria-hidden="true" />}
            title="No tasks scheduled"
            description="Your AI tutor will place tasks here once your study plan is generated from your goals and schedule."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
