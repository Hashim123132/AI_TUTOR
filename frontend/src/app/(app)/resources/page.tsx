import type { Metadata } from "next"
import { BookOpenIcon } from "lucide-react"
import { PlaceholderPage } from "@/components/placeholder-page"
import { requireUser } from "@/lib/auth/dal"

export const metadata: Metadata = { title: "My Resources" }

export default async function ResourcesPage() {
  await requireUser()

  return (
    <PlaceholderPage
      title="My Resources"
      description="Upload PDFs and notes or add website links. The tutor teaches from your own material."
      icon={BookOpenIcon}
      emptyTitle="No resources uploaded"
      emptyDescription="Upload your lecture notes, textbooks, or reading links. The AI will extract topics and difficulty levels to ground its explanations."
    />
  )
}
