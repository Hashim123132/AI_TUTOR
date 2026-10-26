# Plan: Fix Next.js 16 prerender build error on /dashboard

## Diagnosis (verified read-only)

- `frontend/next.config.ts` has `cacheComponents: true` (since commit `c455e6c`).
- Next 16 + Cache Components rule (from `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md`):
  *"A component that reads the session must sit behind a `<Suspense>` boundary. With Cache Components, reading `cookies()` outside a boundary is a **build error**."*
  and: *"create its promise inside the Suspense boundary, **not at the top of a layout**."*
- Commit `89b8fdb` made `frontend/src/app/(app)/layout.tsx` async with a top-level
  `await requireUser()` (reads `cookies()`) + a Supabase query — **outside any Suspense**.
  Prerendering `/dashboard` renders this layout → hard build error.
- Regression proof: builds passed before this commit. The other new files in `89b8fdb`
  are either sync (`(onboarding)/layout.tsx`, `loading.tsx`) or their page-level
  `cookies()` sits behind an automatic `<Suspense>` from `loading.tsx`
  (`(app)/loading.tsx` wrapped the dashboard page before and `(onboarding)/loading.tsx`
  wraps the moved page now). The layout guard is the only new unboundaried access.
- Not caused by demo mode (`NEXT_PUBLIC_DEMO_MODE=false`) or config changes.

## Fix — smallest correct change (1 file)

Modify **only** `frontend/src/app/(app)/layout.tsx`:

1. Keep `AppShell` as the outer static wrapper (sidebar/header/status badge unaffected).
2. Move the guard logic into a new `async function OnboardingGate({ children })`
   — identical logic: `requireUser()` → skip when `demoMode` → select
   `onboarding_completed_at` → `redirect("/onboarding")` when `!error && !profile?.onboarding_completed_at`
   (error fall-through preserved).
3. Render `<Suspense fallback={<Loading />}><OnboardingGate>{children}</OnboardingGate></Suspense>`,
   reusing the existing segment `./loading.tsx` skeleton as the fallback (reuse, no new component).

Effect: static shell (AppShell + skeleton) prerenders; auth/guard data streams in per
request — restoring the pre-regression streaming behavior. Auth check, redirects, and
error handling are unchanged; nothing is cached publicly (user data still resolved per request).

Why this over the alternative `export const instant = false` (the docs' interim
migration flag, also a valid one-liner): that would convert **every** app route from
streaming static shell to fully blocking render (slower TTFB app-wide, opts the tree
out of shell validation). Suspense is the docs' end-state pattern for session reads.

## Execution steps (after approval)

1. Run `cd frontend && npx next build --debug-prerender` — confirm the stack points at
   `(app)/layout.tsx` (the `requireUser()` line) before changing anything.
2. Apply the layout edit above.
3. Run `npm run build` again — confirm it succeeds and all routes generate.
4. Report files changed + build output.

## Files

- Modify: `frontend/src/app/(app)/layout.tsx` (only file)
- No changes to: `next.config.ts`, dashboard page, loading.tsx, other pages
