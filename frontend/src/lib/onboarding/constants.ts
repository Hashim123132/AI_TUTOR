export const EDUCATION_LEVELS = [
  { value: "middle_school", label: "Middle school" },
  { value: "high_school", label: "High school" },
  { value: "undergraduate", label: "Undergraduate" },
  { value: "graduate", label: "Graduate" },
  { value: "professional", label: "Professional" },
  { value: "self_taught", label: "Self-taught" },
] as const;

export const KNOWLEDGE_LEVELS = [
  { value: "beginner", label: "Beginner", hint: "New to this subject" },
  { value: "intermediate", label: "Intermediate", hint: "Some experience already" },
  { value: "advanced", label: "Advanced", hint: "Fairly confident already" },
] as const;

export const STUDY_DAYS = [
  { value: "monday", label: "Mon", fullLabel: "Monday" },
  { value: "tuesday", label: "Tue", fullLabel: "Tuesday" },
  { value: "wednesday", label: "Wed", fullLabel: "Wednesday" },
  { value: "thursday", label: "Thu", fullLabel: "Thursday" },
  { value: "friday", label: "Fri", fullLabel: "Friday" },
  { value: "saturday", label: "Sat", fullLabel: "Saturday" },
  { value: "sunday", label: "Sun", fullLabel: "Sunday" },
] as const;

export const STUDY_MIN_MINUTES = 10;
export const STUDY_MAX_MINUTES = 480;

export const PREFERRED_METHODS = [
  {
    value: "reading",
    label: "Reading",
    description: "Articles, notes, and textbooks",
  },
  {
    value: "videos",
    label: "Videos",
    description: "Watch explanations and walkthroughs",
  },
  {
    value: "explanations",
    label: "Explanations",
    description: "Clear concept breakdowns from your tutor",
  },
  {
    value: "quizzes",
    label: "Quizzes",
    description: "Practice questions with instant feedback",
  },
] as const;

export const ONBOARDING_STEPS = [
  { step: 1, title: "About you", shortTitle: "About" },
  { step: 2, title: "Subjects to study", shortTitle: "Subjects" },
  { step: 3, title: "Current knowledge", shortTitle: "Knowledge" },
  { step: 4, title: "Goals and deadline", shortTitle: "Goals" },
  { step: 5, title: "Study schedule", shortTitle: "Schedule" },
  { step: 6, title: "Learning style", shortTitle: "Style" },
] as const;

export const TOTAL_STEPS = 6;

export type EducationLevel = (typeof EDUCATION_LEVELS)[number]["value"];
export type KnowledgeLevel = (typeof KNOWLEDGE_LEVELS)[number]["value"];
export type StudyDay = (typeof STUDY_DAYS)[number]["value"];
export type PreferredMethod = (typeof PREFERRED_METHODS)[number]["value"];
