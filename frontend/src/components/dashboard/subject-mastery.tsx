import { BookOpenIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Progress } from "@/components/ui/progress"
import type { SubjectMastery } from "@/lib/types"

export function SubjectMasteryCard({ subjects }: { subjects: SubjectMastery[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-base">Subject mastery</CardTitle>
          <CardDescription>
            Estimated mastery based on your quizzes and completed tasks.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="gap-4">
        {subjects.length === 0 ? (
          <EmptyState
            icon={<BookOpenIcon aria-hidden="true" />}
            title="No subjects yet"
            description="Add subjects during onboarding and your mastery map will start filling in as you study."
          />
        ) : (
          <ul className="flex flex-col gap-4">
            {subjects.map((subject) => (
              <li key={subject.subject} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{subject.subject}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {subject.masteryPercent}%
                  </span>
                </div>
                <Progress
                  value={subject.masteryPercent}
                  label={`${subject.subject} mastery`}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
