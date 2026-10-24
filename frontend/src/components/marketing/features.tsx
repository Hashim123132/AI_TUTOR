import {
  CalendarRangeIcon,
  ClipboardCheckIcon,
  MessagesSquareIcon,
  TargetIcon,
  type LucideIcon,
} from "lucide-react"

const features: {
  icon: LucideIcon
  title: string
  description: string
}[] = [
  {
    icon: CalendarRangeIcon,
    title: "Personalized learning plans",
    description:
      "Share your goals, level, and available time. Your tutor builds a week-by-week plan ordered for how you learn — and restructures it as you improve.",
  },
  {
    icon: MessagesSquareIcon,
    title: "AI-powered explanations",
    description:
      "Stuck on a concept? Ask in plain language and get clear, step-by-step explanations calibrated to what you already know.",
  },
  {
    icon: TargetIcon,
    title: "Progress tracking",
    description:
      "See mastery per subject, weekly consistency, and quiz results at a glance, so you always know what to focus on next.",
  },
  {
    icon: ClipboardCheckIcon,
    title: "Practice quizzes",
    description:
      "Short quizzes check your understanding after every topic and adjust difficulty to keep you challenged without overwhelm.",
  },
]

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-brand">Features</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Everything you need to turn goals into progress
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
            Your tutor plans the work, explains the hard parts, checks your
            understanding, and adapts — so every session moves you forward.
          </p>
        </div>

        <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="border-t border-border pt-6">
                <span className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mt-5 text-base font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
