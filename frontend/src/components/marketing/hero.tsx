import Link from "next/link"
import { ProductPreview } from "@/components/marketing/product-preview"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 pt-20 pb-0 sm:px-6 sm:pt-24 lg:px-8 lg:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl leading-[1.05] font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            Learn smarter.
            <br />
            Master more.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
            Your personal AI tutor builds a learning plan around your goals,
            tracks your progress, and helps you understand difficult concepts
            at your own pace.
          </p>

          <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button
              render={<Link href="/signup" />}
              className="h-11 w-full px-6 text-[0.9375rem] sm:w-auto"
            >
              Start learning for free
            </Button>
            <Button
              variant="outline"
              render={<a href="/#how-it-works" />}
              className="h-11 w-full px-6 text-[0.9375rem] sm:w-auto"
            >
              Explore how it works
            </Button>
          </div>
        </div>

        <ProductPreview />
      </div>
    </section>
  )
}
