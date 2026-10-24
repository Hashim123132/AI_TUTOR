const steps = [
  {
    number: "01",
    title: "Tell us about your goals",
    description:
      "Share what you're studying, your current level, and how much time you have each week. Setup takes a few minutes.",
  },
  {
    number: "02",
    title: "Get a plan built for you",
    description:
      "Your AI tutor creates a structured study plan with topics, tasks, and checkpoints — ordered for how you learn best.",
  },
  {
    number: "03",
    title: "Learn, practice, and adapt",
    description:
      "Work through daily tasks, ask questions anytime, and take quizzes. Your plan updates as your mastery grows.",
  },
]

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-t bg-muted/30 py-24 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-brand">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            From goals to a study plan in minutes
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
            Set up once. Your plan keeps adapting long after that.
          </p>
        </div>

        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:divide-x md:divide-border">
          {steps.map((step) => (
            <li
              key={step.number}
              className="md:px-10 md:first:pl-0 md:last:pr-0"
            >
              <p className="text-sm font-semibold tabular-nums text-brand">
                {step.number}
              </p>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
