import type { Metadata } from "next"
import { TargetIcon } from "lucide-react"
import { PlaceholderPage } from "@/components/placeholder-page"
import { requireUser } from "@/lib/auth/dal"

export const metadata: Metadata = { title: "Progress" }

export default async function ProgressPage() {
  await requireUser()

  return (
    <PlaceholderPage
      title="Progress"
      description="Track topic mastery over time and see how quiz results adapt your study plan."
      icon={TargetIcon}
      emptyTitle="Not enough data yet"
      emptyDescription="Complete tasks and quizzes to start building your progress history. This page will show mastery trends per subject and topic."
    />
  )
}
