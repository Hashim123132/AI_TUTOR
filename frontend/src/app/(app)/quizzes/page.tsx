import type { Metadata } from "next"
import { ClipboardCheckIcon } from "lucide-react"
import { PlaceholderPage } from "@/components/placeholder-page"
import { requireUser } from "@/lib/auth/dal"

export const metadata: Metadata = { title: "Quizzes" }

export default async function QuizzesPage() {
  await requireUser()

  return (
    <PlaceholderPage
      title="Quizzes"
      description="Quizzes generated from your learning material, with instant grading and explanations for mistakes."
      icon={ClipboardCheckIcon}
      emptyTitle="No quizzes generated"
      emptyDescription="After you upload resources, quizzes will be generated per topic. Results feed back into your mastery map and adapt your study plan."
    />
  )
}
