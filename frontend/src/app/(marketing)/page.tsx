import type { Metadata } from "next"
import { Features } from "@/components/marketing/features"
import { FinalCta } from "@/components/marketing/final-cta"
import { Hero } from "@/components/marketing/hero"
import { HowItWorks } from "@/components/marketing/how-it-works"

export const metadata: Metadata = {
  title: { absolute: "AI Learning Tutor" },
  description:
    "Your personal AI tutor builds a learning plan around your goals, tracks your progress, and helps you understand difficult concepts at your own pace.",
}

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <FinalCta />
    </>
  )
}
