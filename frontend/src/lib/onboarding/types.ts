import type {
  EducationLevel,
  KnowledgeLevel,
  PreferredMethod,
  StudyDay,
} from "@/lib/onboarding/constants";

export interface SubjectDraft {
  name: string;
  level: KnowledgeLevel | "";
}

export interface OnboardingData {
  displayName: string;
  educationLevel: EducationLevel | "";
  subjects: SubjectDraft[];
  goal: string;
  targetDeadline: string;
  studyDays: StudyDay[];
  studyMinutesPerDay: string;
  preferredMethods: PreferredMethod[];
}

export const emptyOnboardingData = (): OnboardingData => ({
  displayName: "",
  educationLevel: "",
  subjects: [],
  goal: "",
  targetDeadline: "",
  studyDays: [],
  studyMinutesPerDay: "",
  preferredMethods: [],
});
