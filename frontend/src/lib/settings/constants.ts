export type AiProvider = "teacher_shneela" | "groq";

export const DEFAULT_AI_PROVIDER: AiProvider = "teacher_shneela";

export const AI_PROVIDER_LABELS: Record<AiProvider, string> = {
  teacher_shneela: "Teacher Shneela",
  groq: "Groq",
};

export type AiProviderOption = {
  value: AiProvider;
  label: string;
  description: string;
  badge: string;
};

export const AI_PROVIDER_OPTIONS: AiProviderOption[] = [
  {
    value: "teacher_shneela",
    label: "Teacher Shneela",
    description:
      "Our custom study model, built for this tutor. Great for short, focused study drills and continuations.",
    badge: "Custom model",
  },
  {
    value: "groq",
    label: "Groq",
    description:
      "A hosted language model with clear, step-by-step explanations. Uses the Groq service configured by the app.",
    badge: "Hosted LLM",
  },
];

export function isAiProvider(value: unknown): value is AiProvider {
  return value === "teacher_shneela" || value === "groq";
}

export function providerLabel(value: string): string {
  return isAiProvider(value) ? AI_PROVIDER_LABELS[value] : value;
}
