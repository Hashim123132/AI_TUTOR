import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-6"
      aria-busy="true"
      aria-label="Loading setup"
    >
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-2 w-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-9 w-full" />
    </div>
  )
}
