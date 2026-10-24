import type { Metadata } from "next"
import { MessagesSquareIcon } from "lucide-react"
import { PlaceholderPage } from "@/components/placeholder-page"
import { requireUser } from "@/lib/auth/dal"

export const metadata: Metadata = { title: "AI Tutor" }

export default async function TutorPage() {
  await requireUser()

  return (
    <PlaceholderPage
      title="AI Tutor"
      description="Ask questions and get explanations grounded in the resources you uploaded, plus recommended free YouTube videos."
      icon={MessagesSquareIcon}
      emptyTitle="Chat not available yet"
      emptyDescription="Once you add resources, you'll be able to ask questions here and get step-by-step explanations based on your own notes."
    />
  )
}
