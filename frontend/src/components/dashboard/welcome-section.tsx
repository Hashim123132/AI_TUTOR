import { CalendarClockIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { StudentProfile } from "@/lib/types"

export function WelcomeSection({ student }: { student: StudentProfile }) {
  return (
    <section
      aria-labelledby="welcome-heading"
      className="flex flex-col gap-4 rounded-xl border bg-gradient-to-br from-brand/10 via-background to-background p-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-col gap-2">
        <h2 id="welcome-heading" className="text-2xl font-semibold tracking-tight">
          Welcome back, {student.name}
        </h2>
        <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
          {student.goal}
        </p>
      </div>
      <Badge variant="brand" className="w-fit gap-1.5 px-3 py-1.5 text-sm">
        <CalendarClockIcon aria-hidden="true" />
        {student.examCountdownLabel}
      </Badge>
    </section>
  )
}
