"use client"

import { useRef, useState, useTransition } from "react"
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, Loader2Icon, PlusIcon, XIcon } from "lucide-react"
import {
  EDUCATION_LEVELS,
  KNOWLEDGE_LEVELS,
  ONBOARDING_STEPS,
  PREFERRED_METHODS,
  STUDY_DAYS,
  STUDY_MAX_MINUTES,
  STUDY_MIN_MINUTES,
  TOTAL_STEPS,
} from "@/lib/onboarding/constants"
import type { OnboardingData, SubjectDraft } from "@/lib/onboarding/types"
import { hasErrors, validateStep, type FieldErrors } from "@/lib/onboarding/validation"
import {
  submitOnboardingStep,
} from "@/lib/onboarding/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FieldError, Input } from "@/components/ui/input"
import { LogoutButton } from "@/components/auth/logout-button"

function tomorrowIso(): string {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

type Props = {
  initialData: OnboardingData
  initialStep: number
}

export function OnboardingWizard({ initialData, initialStep }: Props) {
  const [data, setData] = useState<OnboardingData>(initialData)
  const [activeStep, setActiveStep] = useState(initialStep)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saveError, setSaveError] = useState<string | undefined>(undefined)
  const [subjectDraft, setSubjectDraft] = useState("")
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()

  const stepMeta = ONBOARDING_STEPS[activeStep - 1]

  function focusFirstInvalid() {
    window.requestAnimationFrame(() => {
      const target = formRef.current?.querySelector<HTMLElement>(
        '[aria-invalid="true"]'
      )
      target?.focus()
    })
  }

  function updateField<K extends keyof OnboardingData>(
    key: K,
    value: OnboardingData[K]
  ) {
    setData((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!(key in current)) return current
      const next = { ...current }
      delete next[key as string]
      return next
    })
  }

  function addSubject() {
    const name = subjectDraft.trim()
    if (!name) return
    if (data.subjects.length >= 10) {
      setErrors((current) => ({
        ...current,
        subjects: "You can track up to 10 subjects.",
      }))
      return
    }
    if (
      data.subjects.some((subject) => subject.name.toLowerCase() === name.toLowerCase())
    ) {
      setErrors((current) => ({
        ...current,
        subjects: "This subject is already on your list.",
      }))
      return
    }
    const next: SubjectDraft[] = [...data.subjects, { name, level: "" }]
    updateField("subjects", next)
    setSubjectDraft("")
  }

  function removeSubject(index: number) {
    const next = data.subjects.filter((_, position) => position !== index)
    updateField("subjects", next)
  }

  function setSubjectLevel(index: number, level: SubjectDraft["level"]) {
    const next = data.subjects.map((subject, position) =>
      position === index ? { ...subject, level } : subject
    )
    updateField("subjects", next)
    setErrors((current) => {
      const key = `knowledge-${index}`
      if (!(key in current)) return current
      const cleaned = { ...current }
      delete cleaned[key]
      return cleaned
    })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const clientErrors = validateStep(activeStep, data)
    if (hasErrors(clientErrors)) {
      setErrors(clientErrors)
      setSaveError(undefined)
      focusFirstInvalid()
      return
    }

    const formData = new FormData(form)
    setErrors({})
    setSaveError(undefined)

    startTransition(async () => {
      const result = await submitOnboardingStep(null, formData)
      if (result.ok && result.nextStep) {
        setData(result.data)
        setErrors({})
        setActiveStep(Math.min(result.nextStep, TOTAL_STEPS))
        return
      }
      setErrors(result.errors)
      if (result.saveError) {
        setSaveError(result.saveError)
      }
      if (Object.keys(result.errors).length > 0) {
        focusFirstInvalid()
      }
    })
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardContent className="flex flex-col gap-6 p-5 sm:p-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-muted-foreground">
            Step {activeStep} of {TOTAL_STEPS}
          </p>
          {activeStep === 1 ? <LogoutButton /> : null}
        </div>

        <ol className="flex gap-1.5" aria-label="Onboarding progress">
          {ONBOARDING_STEPS.map((step) => {
            const isComplete = step.step < activeStep
            const isCurrent = step.step === activeStep
            return (
              <li
                key={step.step}
                aria-current={isCurrent ? "step" : undefined}
                className={[
                  "h-1.5 flex-1 rounded-full",
                  isComplete
                    ? "bg-brand"
                    : isCurrent
                      ? "bg-brand/40"
                      : "bg-muted",
                ].join(" ")}
                title={step.title}
              >
                <span className="sr-only">
                  {step.title}
                  {isComplete ? " (completed)" : ""}
                  {isCurrent ? " (current)" : ""}
                </span>
              </li>
            )
          })}
        </ol>

        <div>
          <h1 className="text-xl font-semibold tracking-tight">{stepMeta.title}</h1>
          <p className="text-sm text-muted-foreground">
            {activeStep === 1
              ? "Tell us a little about yourself so your tutor can adapt."
              : activeStep === 2
                ? "Add the subjects you want your tutor to help with."
                : activeStep === 3
                  ? "Rate your current comfort level for each subject."
                  : activeStep === 4
                    ? "What are you working toward, and by when?"
                    : activeStep === 5
                      ? "When can you study, and for how long?"
                      : "How do you learn best?"}
          </p>
        </div>
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex flex-col gap-6"
        noValidate
      >
        <input type="hidden" name="form_step" value={activeStep} />
        <input
          type="hidden"
          name="subjects_json"
          value={JSON.stringify(data.subjects)}
        />

        {saveError ? (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm font-medium text-destructive"
          >
            {saveError}
          </p>
        ) : null}

        {activeStep === 1 ? (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="displayName" className="text-sm font-medium">
                Your name
              </label>
              <Input
                id="displayName"
                name="displayName"
                value={data.displayName}
                onChange={(event) => updateField("displayName", event.target.value)}
                placeholder="How should we greet you?"
                autoComplete="name"
                aria-invalid={Boolean(errors.displayName) || undefined}
                aria-describedby={errors.displayName ? "displayName-error" : undefined}
                data-invalid={Boolean(errors.displayName) || undefined}
                disabled={isPending}
              />
              <FieldError id="displayName-error" message={errors.displayName} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="educationLevel" className="text-sm font-medium">
                Current education level
              </label>
              <select
                id="educationLevel"
                name="educationLevel"
                value={data.educationLevel}
                onChange={(event) =>
                  updateField(
                    "educationLevel",
                    event.target.value as OnboardingData["educationLevel"]
                  )
                }
                aria-invalid={Boolean(errors.educationLevel) || undefined}
                aria-describedby={
                  errors.educationLevel ? "educationLevel-error" : undefined
                }
                data-invalid={Boolean(errors.educationLevel) || undefined}
                disabled={isPending}
                className="flex h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              >
                <option value="" disabled>
                  Choose one...
                </option>
                {EDUCATION_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
              <FieldError id="educationLevel-error" message={errors.educationLevel} />
            </div>
          </div>
        ) : null}

        {activeStep === 2 ? (
          <div className="space-y-4">
            {data.subjects.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {data.subjects.map((subject, index) => (
                  <li
                    key={`${subject.name}-${index}`}
                    className="flex items-center gap-1.5 rounded-full border bg-muted/40 py-1 pl-3 pr-1.5 text-sm"
                  >
                    <span>{subject.name}</span>
                    <button
                      type="button"
                      onClick={() => removeSubject(index)}
                      aria-label={`Remove ${subject.name}`}
                      disabled={isPending}
                      className="flex size-6 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <XIcon aria-hidden="true" className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="flex gap-2">
              <Input
                value={subjectDraft}
                onChange={(event) => setSubjectDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    addSubject()
                  }
                }}
                placeholder="e.g. Algebra, Biology, Spanish"
                aria-label="Subject name"
                aria-invalid={Boolean(errors.subjects) || undefined}
                data-invalid={Boolean(errors.subjects) || undefined}
                disabled={isPending}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addSubject}
                disabled={isPending}
                className="shrink-0 gap-1.5"
              >
                <PlusIcon aria-hidden="true" className="size-4" />
                Add
              </Button>
            </div>
            <FieldError id="subjects-error" message={errors.subjects} />
          </div>
        ) : null}

        {activeStep === 3 ? (
          <div className="space-y-4">
            {data.subjects.map((subject, index) => (
              <div
                key={`${subject.name}-${index}`}
                className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm font-medium">{subject.name}</span>
                <div
                  role="group"
                  aria-label={`Knowledge level for ${subject.name}`}
                  className="flex gap-1.5"
                >
                  {KNOWLEDGE_LEVELS.map((level) => {
                    const selected = subject.level === level.value
                    return (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => setSubjectLevel(index, level.value)}
                        aria-pressed={selected}
                        disabled={isPending}
                        className={[
                          "rounded-lg border px-3 py-1.5 text-sm outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50",
                          selected
                            ? "border-brand bg-brand text-brand-foreground"
                            : "bg-background text-muted-foreground hover:text-foreground",
                        ].join(" ")}
                      >
                        {level.label}
                      </button>
                    )
                  })}
                </div>
                <FieldError
                  id={`knowledge-${index}-error`}
                  message={errors[`knowledge-${index}`]}
                />
              </div>
            ))}
          </div>
        ) : null}

        {activeStep === 4 ? (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="goal" className="text-sm font-medium">
                Your goal
              </label>
              <textarea
                id="goal"
                name="goal"
                value={data.goal}
                onChange={(event) => updateField("goal", event.target.value)}
                rows={4}
                placeholder="e.g. Pass my final math exam with 85%+ and feel confident with calculus basics."
                aria-invalid={Boolean(errors.goal) || undefined}
                aria-describedby={errors.goal ? "goal-error" : undefined}
                data-invalid={Boolean(errors.goal) || undefined}
                disabled={isPending}
                className="flex min-h-28 w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              />
              <FieldError id="goal-error" message={errors.goal} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="targetDeadline" className="text-sm font-medium">
                Target deadline
              </label>
              <Input
                id="targetDeadline"
                name="targetDeadline"
                type="date"
                min={tomorrowIso()}
                value={data.targetDeadline}
                onChange={(event) =>
                  updateField("targetDeadline", event.target.value)
                }
                aria-invalid={Boolean(errors.targetDeadline) || undefined}
                aria-describedby={
                  errors.targetDeadline ? "targetDeadline-error" : undefined
                }
                data-invalid={Boolean(errors.targetDeadline) || undefined}
                disabled={isPending}
              />
              <FieldError id="targetDeadline-error" message={errors.targetDeadline} />
            </div>
          </div>
        ) : null}

        {activeStep === 5 ? (
          <div className="space-y-5">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Study days</legend>
              <div className="flex flex-wrap gap-2">
                {STUDY_DAYS.map((day) => {
                  const checked = data.studyDays.includes(day.value)
                  return (
                    <label
                      key={day.value}
                      className={[
                        "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm outline-none transition focus-within:ring-3 focus-within:ring-ring/50",
                        checked
                          ? "border-brand bg-brand text-brand-foreground"
                          : "bg-background text-muted-foreground hover:text-foreground",
                      ].join(" ")}
                    >
                      <input
                        type="checkbox"
                        name="study_days"
                        value={day.value}
                        checked={checked}
                        disabled={isPending}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? [...data.studyDays, day.value]
                            : data.studyDays.filter((value) => value !== day.value)
                          updateField("studyDays", next)
                        }}
                        className="sr-only"
                      />
                      {day.label}
                      <span className="sr-only">{day.fullLabel}</span>
                    </label>
                  )
                })}
              </div>
              <FieldError id="studyDays-error" message={errors.studyDays} />
            </fieldset>

            <div className="space-y-1.5">
              <label htmlFor="studyMinutesPerDay" className="text-sm font-medium">
                Minutes per study day
              </label>
              <Input
                id="studyMinutesPerDay"
                name="studyMinutesPerDay"
                type="number"
                inputMode="numeric"
                min={STUDY_MIN_MINUTES}
                max={STUDY_MAX_MINUTES}
                step={5}
                value={data.studyMinutesPerDay}
                onChange={(event) =>
                  updateField("studyMinutesPerDay", event.target.value)
                }
                placeholder="e.g. 45"
                aria-invalid={Boolean(errors.studyMinutesPerDay) || undefined}
                aria-describedby={
                  errors.studyMinutesPerDay ? "studyMinutesPerDay-error" : undefined
                }
                data-invalid={Boolean(errors.studyMinutesPerDay) || undefined}
                disabled={isPending}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[15, 30, 45, 60, 90, 120].map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => updateField("studyMinutesPerDay", String(minutes))}
                    disabled={isPending}
                    className={[
                      "rounded-full border px-3 py-1 text-xs text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                      data.studyMinutesPerDay === String(minutes)
                        ? "border-brand text-foreground"
                        : "",
                    ].join(" ")}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>
              <FieldError
                id="studyMinutesPerDay-error"
                message={errors.studyMinutesPerDay}
              />
            </div>
          </div>
        ) : null}

        {activeStep === 6 ? (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Learning methods</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {PREFERRED_METHODS.map((method) => {
                const checked = data.preferredMethods.includes(method.value)
                return (
                  <label
                    key={method.value}
                    className={[
                      "flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-4 text-sm outline-none transition focus-within:ring-3 focus-within:ring-ring/50",
                      checked ? "border-brand" : "hover:border-foreground/30",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      name="preferred_methods"
                      value={method.value}
                      checked={checked}
                      disabled={isPending}
                      onChange={(event) => {
                        const next = event.target.checked
                          ? [...data.preferredMethods, method.value]
                          : data.preferredMethods.filter(
                              (value) => value !== method.value
                            )
                        updateField("preferredMethods", next)
                      }}
                      className="mt-0.5 size-4 shrink-0 accent-brand"
                    />
                    <span className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        {method.label}
                        {checked ? (
                          <CheckIcon
                            aria-hidden="true"
                            className="size-3.5 text-brand"
                          />
                        ) : null}
                      </span>
                      <span className="text-muted-foreground">{method.description}</span>
                    </span>
                  </label>
                )
              })}
            </div>
            <FieldError id="preferredMethods-error" message={errors.preferredMethods} />
          </fieldset>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t pt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setErrors({})
              setActiveStep((current) => Math.max(1, current - 1))
            }}
            disabled={isPending || activeStep === 1}
            className="gap-1.5"
          >
            <ArrowLeftIcon aria-hidden="true" className="size-4" />
            Back
          </Button>

          <Button type="submit" disabled={isPending} className="gap-1.5">
            {isPending ? (
              <>
                <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
                Saving...
              </>
            ) : activeStep === TOTAL_STEPS ? (
              <>
                Finish setup
                <CheckIcon aria-hidden="true" className="size-4" />
              </>
            ) : (
              <>
                Continue
                <ArrowRightIcon aria-hidden="true" className="size-4" />
              </>
            )}
          </Button>
        </div>
      </form>
      </CardContent>
    </Card>
  )
}
