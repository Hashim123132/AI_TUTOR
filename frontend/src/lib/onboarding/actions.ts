"use server"

import { redirect } from "next/navigation"
import { requireUser } from "@/lib/auth/dal"
import {
  KNOWLEDGE_LEVELS,
  TOTAL_STEPS,
} from "@/lib/onboarding/constants"
import {
  PROFILE_COLUMNS,
  parseOnboardingForm,
  rowToOnboardingData,
  type ProfileRow,
  type SubjectRow,
} from "@/lib/onboarding/draft"
import { emptyOnboardingData, type OnboardingData, type SubjectDraft } from "@/lib/onboarding/types"
import { hasErrors, validateStep, type FieldErrors } from "@/lib/onboarding/validation"

export type OnboardingActionResult = {
  ok: boolean
  step: number
  nextStep: number | null
  data: OnboardingData
  errors: FieldErrors
  saveError?: string
}

const knowledgeValues = new Set<string>(KNOWLEDGE_LEVELS.map((item) => item.value))

async function loadProfileAndSubjects(
  userId: string,
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"]
) {
  const [{ data: profile }, { data: subjects }] = await Promise.all([
    supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("subjects")
      .select("id, name, level, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true }),
  ])
  return {
    profile: (profile ?? null) as ProfileRow | null,
    subjects: (subjects ?? []) as SubjectRow[],
  }
}

function failure(
  step: number,
  data: OnboardingData,
  errors: FieldErrors,
  saveError?: string
): OnboardingActionResult {
  return { ok: false, step, nextStep: null, data, errors, saveError }
}

async function persistStep(
  step: number,
  formData: FormData
): Promise<OnboardingActionResult> {
  const { user, supabase } = await requireUser()

  const submitted = parseOnboardingForm(formData)
  const { profile, subjects } = await loadProfileAndSubjects(user.id, supabase)
  const existing = rowToOnboardingData(profile, subjects)

  const existingByName = new Map(
    existing.subjects.map((subject) => [subject.name.toLowerCase(), subject])
  )
  const submittedLevels = new Map(
    submitted.subjects.map((subject) => [subject.name.toLowerCase(), subject.level])
  )

  const merged: OnboardingData =
    step === 1
      ? {
          ...existing,
          displayName: submitted.displayName,
          educationLevel: submitted.educationLevel,
        }
      : step === 2
        ? {
            ...existing,
            subjects: submitted.subjects.map((subject) => {
              const previous = existingByName.get(subject.name.toLowerCase())
              return {
                name: subject.name,
                level: knowledgeValues.has(previous?.level ?? "")
                  ? (previous?.level as SubjectDraft["level"])
                  : subject.level,
              }
            }),
          }
        : step === 3
          ? {
              ...existing,
              subjects: existing.subjects.map((subject) => {
                const level = submittedLevels.get(subject.name.toLowerCase())
                return {
                  name: subject.name,
                  level: knowledgeValues.has(level ?? "")
                    ? (level as SubjectDraft["level"])
                    : subject.level,
                }
              }),
            }
          : step === 4
            ? {
                ...existing,
                goal: submitted.goal,
                targetDeadline: submitted.targetDeadline,
              }
            : step === 5
              ? {
                  ...existing,
                  studyDays: submitted.studyDays,
                  studyMinutesPerDay: submitted.studyMinutesPerDay,
                }
              : { ...existing, preferredMethods: submitted.preferredMethods }

  const errors = validateStep(step, merged)
  if (hasErrors(errors)) {
    return failure(step, merged, errors)
  }

  const profilePatch: Record<string, unknown> = {
    current_step: Math.min(TOTAL_STEPS, Math.max(profile?.current_step ?? 1, step + 1)),
  }
  if (step === 1) {
    profilePatch.display_name = merged.displayName.trim()
    profilePatch.education_level = merged.educationLevel
  }
  if (step === 4) {
    profilePatch.goal = merged.goal.trim()
    profilePatch.target_deadline = merged.targetDeadline
  }
  if (step === 5) {
    profilePatch.study_days = merged.studyDays
    profilePatch.study_minutes_per_day = Number(merged.studyMinutesPerDay)
  }
  if (step === 6) {
    profilePatch.preferred_methods = merged.preferredMethods
  }

  if (!profile) {
    const { error: insertError } = await supabase.from("profiles").insert({
      user_id: user.id,
      current_step: Math.min(TOTAL_STEPS, Math.max(2, step + 1)),
      ...(step === 1
        ? {
            display_name: merged.displayName.trim(),
            education_level: merged.educationLevel,
          }
        : {}),
    })
    if (insertError) {
      return failure(
        step,
        merged,
        {},
        `Could not save your progress (${insertError.message}). Try again.`
      )
    }
  }

  if (step !== 2 && step !== 3) {
    const { error } = await supabase
      .from("profiles")
      .update(profilePatch)
      .eq("user_id", user.id)
    if (error) {
      return failure(
        step,
        merged,
        {},
        `Could not save your progress (${error.message}). Try again.`
      )
    }
  } else if (profile) {
    const { error } = await supabase
      .from("profiles")
      .update({ current_step: profilePatch.current_step })
      .eq("user_id", user.id)
    if (error) {
      return failure(step, merged, {}, "Could not save your progress. Try again.")
    }
  }

  if (step === 2) {
    const names = merged.subjects.map((subject) => subject.name.trim())
    const { data: currentRows } = await supabase
      .from("subjects")
      .select("id, name, level")
      .eq("user_id", user.id)

    const keepByName = new Map<string, SubjectRow>()
    for (const row of currentRows ?? []) {
      keepByName.set(row.name.toLowerCase(), row)
    }

    const staleIds = (currentRows ?? [])
      .filter(
        (row) => !names.some((name) => name.toLowerCase() === row.name.toLowerCase())
      )
      .map((row) => row.id)

    if (staleIds.length > 0) {
      const { error } = await supabase
        .from("subjects")
        .delete()
        .eq("user_id", user.id)
        .in("id", staleIds)
      if (error) {
        return failure(step, merged, {}, "Could not save your subjects. Try again.")
      }
    }

    for (const subject of merged.subjects) {
      const existingRow = keepByName.get(subject.name.toLowerCase())
      if (!existingRow) {
        const { error } = await supabase
          .from("subjects")
          .insert({ user_id: user.id, name: subject.name.trim() })
        if (error) {
          return failure(step, merged, {}, "Could not save your subjects. Try again.")
        }
      } else if (existingRow.name !== subject.name.trim()) {
        const { error } = await supabase
          .from("subjects")
          .update({ name: subject.name.trim() })
          .eq("id", existingRow.id)
        if (error) {
          return failure(step, merged, {}, "Could not save your subjects. Try again.")
        }
      }
    }
  }

  if (step === 3) {
    const { data: currentRows } = await supabase
      .from("subjects")
      .select("id, name, level")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })

    const ordered = currentRows ?? []
    for (let index = 0; index < ordered.length; index += 1) {
      const level = merged.subjects[index]?.level
      if (
        ordered[index] &&
        knowledgeValues.has(level ?? "") &&
        ordered[index].level !== level
      ) {
        const { error } = await supabase
          .from("subjects")
          .update({ level })
          .eq("id", ordered[index].id)
        if (error) {
          return failure(
            step,
            merged,
            {},
            "Could not save your knowledge levels. Try again."
          )
        }
      }
    }
  }

  if (step < TOTAL_STEPS) {
    return { ok: true, step, nextStep: step + 1, data: merged, errors: {} }
  }

  const finalErrors = validateStep(TOTAL_STEPS, merged)
  if (hasErrors(finalErrors)) {
    return failure(step, merged, finalErrors)
  }

  const { error: completeError } = await supabase
    .from("profiles")
    .update({
      current_step: TOTAL_STEPS,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
  if (completeError) {
    return failure(
      step,
      merged,
      {},
      `Could not finish setup (${completeError.message}). Try again.`
    )
  }

  redirect("/dashboard")
}

export async function saveStep1(
  _prev: OnboardingActionResult | null,
  formData: FormData
): Promise<OnboardingActionResult> {
  return persistStep(1, formData)
}

export async function saveStep2(
  _prev: OnboardingActionResult | null,
  formData: FormData
): Promise<OnboardingActionResult> {
  return persistStep(2, formData)
}

export async function saveStep3(
  _prev: OnboardingActionResult | null,
  formData: FormData
): Promise<OnboardingActionResult> {
  return persistStep(3, formData)
}

export async function saveStep4(
  _prev: OnboardingActionResult | null,
  formData: FormData
): Promise<OnboardingActionResult> {
  return persistStep(4, formData)
}

export async function saveStep5(
  _prev: OnboardingActionResult | null,
  formData: FormData
): Promise<OnboardingActionResult> {
  return persistStep(5, formData)
}

export async function saveStep6(
  _prev: OnboardingActionResult | null,
  formData: FormData
): Promise<OnboardingActionResult> {
  return persistStep(6, formData)
}

export async function submitOnboardingStep(
  prev: OnboardingActionResult | null,
  formData: FormData
): Promise<OnboardingActionResult> {
  const step = Number(formData.get("form_step"))
  switch (step) {
    case 1:
      return saveStep1(prev, formData)
    case 2:
      return saveStep2(prev, formData)
    case 3:
      return saveStep3(prev, formData)
    case 4:
      return saveStep4(prev, formData)
    case 5:
      return saveStep5(prev, formData)
    case 6:
      return saveStep6(prev, formData)
    default:
      return failure(
        0,
        emptyOnboardingData(),
        {},
        "Something went wrong with this step. Reload the page and try again."
      )
  }
}
