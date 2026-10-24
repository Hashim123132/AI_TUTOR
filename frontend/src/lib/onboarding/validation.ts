import {
  EDUCATION_LEVELS,
  KNOWLEDGE_LEVELS,
  STUDY_MAX_MINUTES,
  STUDY_MIN_MINUTES,
  TOTAL_STEPS,
} from "@/lib/onboarding/constants"
import type { OnboardingData } from "@/lib/onboarding/types"

export type FieldErrors = Record<string, string>;

const educationValues = new Set<string>(EDUCATION_LEVELS.map((item) => item.value));
const knowledgeValues = new Set<string>(KNOWLEDGE_LEVELS.map((item) => item.value));

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email) return "Enter your email address.";
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Enter your password.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

export function validateCredentials(
  email: string,
  password: string
): FieldErrors {
  const errors: FieldErrors = {};
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  return errors;
}

export function isFutureDate(value: string, today = new Date()): boolean {
  const parsed = parseDateOnly(value);
  if (!parsed) return false;
  const tomorrow = new Date(today);
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return parsed.getTime() >= tomorrow.getTime();
}

export function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function validateStep(step: number, data: OnboardingData): FieldErrors {
  const errors: FieldErrors = {};

  if (step === 1) {
    const name = data.displayName.trim();
    if (name.length < 2) {
      errors.displayName = "Enter your name (at least 2 characters).";
    } else if (name.length > 100) {
      errors.displayName = "Keep your name under 100 characters.";
    }
    if (!educationValues.has(data.educationLevel)) {
      errors.educationLevel = "Choose your current education level.";
    }
  }

  if (step === 2) {
    const names = data.subjects.map((subject) => subject.name.trim());
    if (names.length < 1) {
      errors.subjects = "Add at least one subject you want to study.";
    } else if (names.length > 10) {
      errors.subjects = "You can track up to 10 subjects.";
    }
    const seen = new Set<string>();
    names.forEach((name, index) => {
      if (name.length < 1) {
        errors[`subject-${index}`] = "Subject names cannot be empty.";
      } else if (name.length > 60) {
        errors[`subject-${index}`] = "Keep subject names under 60 characters.";
      }
      const key = name.toLowerCase();
      if (name && seen.has(key)) {
        errors[`subject-${index}`] = "This subject is already on your list.";
      }
      seen.add(key);
    });
  }

  if (step === 3) {
    data.subjects.forEach((subject, index) => {
      if (!knowledgeValues.has(subject.level)) {
        errors[`knowledge-${index}`] = "Choose how comfortable you feel with this subject.";
      }
    });
  }

  if (step === 4) {
    const goal = data.goal.trim();
    if (goal.length < 10) {
      errors.goal = "Describe your goal in a bit more detail (at least 10 characters).";
    } else if (goal.length > 500) {
      errors.goal = "Keep your goal under 500 characters.";
    }
    if (!data.targetDeadline) {
      errors.targetDeadline = "Pick a target deadline.";
    } else if (!isFutureDate(data.targetDeadline)) {
      errors.targetDeadline = "Choose a date starting tomorrow.";
    }
  }

  if (step === 5) {
    if (data.studyDays.length < 1) {
      errors.studyDays = "Choose at least one day you can study.";
    }
    const minutes = Number(data.studyMinutesPerDay);
    if (
      !data.studyMinutesPerDay ||
      !Number.isInteger(minutes) ||
      minutes < STUDY_MIN_MINUTES ||
      minutes > STUDY_MAX_MINUTES
    ) {
      errors.studyMinutesPerDay = `Enter study time between ${STUDY_MIN_MINUTES} and ${STUDY_MAX_MINUTES} minutes.`;
    }
  }

  if (step === 6) {
    if (data.preferredMethods.length < 1) {
      errors.preferredMethods = "Pick at least one learning method you prefer.";
    }
  }

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function validateStepRange(step: number): boolean {
  return Number.isInteger(step) && step >= 1 && step <= TOTAL_STEPS;
}
