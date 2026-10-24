import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

type PageHeaderProps = ComponentProps<"header"> & {
  title: string
  description?: string
}

function PageHeader({ className, title, description, ...props }: PageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    >
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description ? (
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          {description}
        </p>
      ) : null}
    </header>
  )
}

export { PageHeader }
