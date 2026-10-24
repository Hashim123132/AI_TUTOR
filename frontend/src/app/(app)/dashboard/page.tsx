import { redirect } from "next/navigation"
import { RecentQuizzes } from "@/components/dashboard/recent-quizzes"
import { SubjectMasteryCard } from "@/components/dashboard/subject-mastery"
import { TaskListCard } from "@/components/dashboard/task-list"
import { WeekPlanPreview } from "@/components/dashboard/week-plan-preview"
import { WelcomeSection } from "@/components/dashboard/welcome-section"
import { ProgressSummaryCards } from "@/components/dashboard/progress-summary"
import { ErrorState } from "@/components/ui/error-state"
import { requireUser } from "@/lib/auth/dal"
import { fetchDashboard } from "@/lib/api/dashboard"
import { demoMode } from "@/lib/supabase/config"
import { sampleDashboardData } from "@/lib/sample-data"
import type { DashboardData } from "@/lib/types"

function DashboardView({ data }: { data: DashboardData }) {
  const { student, summary, todayTasks, upcomingTasks, week, recentQuizzes } = data

  return (
    <div className="flex flex-col gap-6">
      <WelcomeSection student={student} />
      <ProgressSummaryCards summary={summary} />

      <div className="grid gap-6 lg:grid-cols-2">
        <TaskListCard
          title="Today's tasks"
          description="Your personalized tasks for today, ordered by schedule."
          tasks={todayTasks}
        />
        <TaskListCard
          title="Upcoming tasks"
          description="What's coming up next in your study plan."
          tasks={upcomingTasks}
        />
      </div>

      <WeekPlanPreview week={week} />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentQuizzes quizzes={recentQuizzes} />
        <SubjectMasteryCard subjects={summary.subjects} />
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const { accessToken } = await requireUser()

  if (demoMode) {
    return <DashboardView data={sampleDashboardData} />
  }

  const result = await fetchDashboard(accessToken)

  if (result.kind === "onboarding_required") {
    redirect("/onboarding")
  }
  if (result.kind === "unauthorized") {
    redirect("/login")
  }
  if (result.kind === "error") {
    return (
      <ErrorState
        title="Dashboard unavailable"
        description={result.message}
      />
    )
  }

  return <DashboardView data={result.data} />
}
