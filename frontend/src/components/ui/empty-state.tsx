import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/utils"

type EmptyStateProps = ComponentProps<"div"> & {
  icon?: ReactNode
  title: string
  description: string
  children?: ReactNode
}

function EmptyState({
  className,
  icon,
  title,
  description,
  children,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center",
        className
      )}
      {...props}
    >
      {icon ? (
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand [&_svg]:size-5">
          {icon}
        </div>
      ) : null}
      <div className="flex max-w-sm flex-col gap-1.5">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children ? <div className="mt-1">{children}</div> : null}
    </div>
  )
}

export { EmptyState }
