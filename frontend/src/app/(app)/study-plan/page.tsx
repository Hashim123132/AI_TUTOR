import type { Metadata } from "next"
import { CalendarRangeIcon } from "lucide-react"
import { PlaceholderPage } from "@/components/placeholder-page"
import { requireUser } from "@/lib/auth/dal"

export const metadata: Metadata = { title: "Study Plan" }

export default async function StudyPlanPage() {
  await requireUser()

  return (
    <PlaceholderPage
      title="Study Plan"
      description="Your personalized weekly schedule, generated from your goals, available time, and deadlines."
      icon={CalendarRangeIcon}
      emptyTitle="No study plan yet"
      emptyDescription="Complete onboarding and the AI will build your first weekly plan. This page will show day-by-day tasks you can check off as you go."
    />
  )
}
