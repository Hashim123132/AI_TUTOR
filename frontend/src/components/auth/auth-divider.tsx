export function AuthDivider() {
  return (
    <div className="relative text-center" aria-hidden="true">
      <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
      <span className="relative bg-card px-3 text-xs font-medium text-muted-foreground">
        or
      </span>
    </div>
  )
}
