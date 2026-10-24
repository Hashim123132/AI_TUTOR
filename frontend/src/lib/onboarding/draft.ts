import {
  EDUCATION_LEVELS,
  KNOWLEDGE_LEVELS,
  PREFERRED_METHODS,
  STUDY_DAYS,
  type EducationLevel,
  type PreferredMethod,
  type StudyDay,
} from "@/lib/onboarding/constants"
import { emptyOnboardingData, type OnboardingData, type SubjectDraft } from "@/lib/onboarding/types"

export type ProfileRow = {
  current_step: number | null
  display_name: string | null
  education_level: string | null
  goal: string | null
  target_deadline: string | null
  study_days: string[] | null
  study_minutes_per_day: number | null
  preferred_methods: string[] | null
  onboarding_completed_at: string | null
}

export type SubjectRow = {
  id: string
  name: string
  level: string | null
  created_at?: string
}

const educationValues = new Set<string>(EDUCATION_LEVELS.map((item) => item.value))
const knowledgeValues = new Set<string>(KNOWLEDGE_LEVELS.map((item) => item.value))
const studyDayValues = new Set<string>(STUDY_DAYS.map((item) => item.value))
const methodValues = new Set<string>(PREFERRED_METHODS.map((item) => item.value))

export const PROFILE_COLUMNS =
  "current_step, display_name, education_level, goal, target_deadline, study_days, study_minutes_per_day, preferred_methods, onboarding_completed_at"

export function rowToOnboardingData(
  profile: ProfileRow | null,
  subjects: SubjectRow[]
): OnboardingData {
  if (!profile) return emptyOnboardingData()
  return {
    displayName: profile.display_name ?? "",
    educationLevel: educationValues.has(profile.education_level ?? "")
      ? (profile.education_level as EducationLevel)
      : "",
    subjects: subjects.map((subject) => ({
      name: subject.name,
      level: knowledgeValues.has(subject.level ?? "")
        ? (subject.level as SubjectDraft["level"])
        : "",
    })),
    goal: profile.goal ?? "",
    targetDeadline: profile.target_deadline ?? "",
    studyDays: (profile.study_days ?? []).filter((day): day is StudyDay =>
      studyDayValues.has(day)
    ),
    studyMinutesPerDay:
      profile.study_minutes_per_day != null
        ? String(profile.study_minutes_per_day)
        : "",
    preferredMethods: (profile.preferred_methods ?? []).filter(
      (method): method is PreferredMethod => methodValues.has(method)
    ),
  }
}

function parseSubjectsJson(raw: FormDataEntryValue | null): SubjectDraft[] {
  if (typeof raw !== "string" || raw.length === 0) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap<SubjectDraft>((item) => {
      if (typeof item !== "object" || item === null) return []
      const record = item as Record<string, unknown>
      const name = typeof record.name === "string" ? record.name : ""
      const level =
        typeof record.level === "string" && knowledgeValues.has(record.level)
          ? (record.level as SubjectDraft["level"])
          : ""
      return [{ name, level }]
    })
  } catch {
    return []
  }
}

export function parseOnboardingForm(formData: FormData): OnboardingData {
  const educationLevel = String(formData.get("educationLevel") ?? "")
  return {
    displayName: String(formData.get("displayName") ?? ""),
    educationLevel: educationValues.has(educationLevel)
      ? (educationLevel as EducationLevel)
      : "",
    subjects: parseSubjectsJson(formData.get("subjects_json")),
    goal: String(formData.get("goal") ?? ""),
    targetDeadline: String(formData.get("targetDeadline") ?? ""),
    studyDays: [
      ...new Set(
        formData
          .getAll("study_days")
          .map(String)
          .filter((day): day is StudyDay => studyDayValues.has(day))
      ),
    ],
    studyMinutesPerDay: String(formData.get("studyMinutesPerDay") ?? ""),
    preferredMethods: [
      ...new Set(
        formData
          .getAll("preferred_methods")
          .map(String)
          .filter((method): method is PreferredMethod => methodValues.has(method))
      ),
    ],
  }
}

export function knowledgeValuesSet(): ReadonlySet<string> {
  return knowledgeValues
}

export { emptyOnboardingData }
