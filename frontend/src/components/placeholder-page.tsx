import type { LucideIcon } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"

type PlaceholderPageProps = {
  title: string
  description: string
  icon: LucideIcon
  emptyTitle: string
  emptyDescription: string
}

export function PlaceholderPage({
  title,
  description,
  icon: Icon,
  emptyTitle,
  emptyDescription,
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={<Icon aria-hidden="true" />}
        title={emptyTitle}
        description={emptyDescription}
      >
        <p className="text-xs text-muted-foreground">
          This feature is planned for a later phase. Check back soon.
        </p>
      </EmptyState>
    </div>
  )
}
