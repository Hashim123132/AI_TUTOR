import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

type ProgressProps = ComponentProps<"div"> & {
  value: number;
  max?: number;
  label: string;
}

function Progress({ className, value, max = 100, label, ...props }: ProgressProps) {
  const clamped = Math.min(Math.max(value, 0), max)
  const percent = max > 0 ? Math.round((clamped / max) * 100) : 0

  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={clamped}
      aria-valuetext={`${percent}%`}
      aria-label={label}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-primary/15",
        className
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

export { Progress }
