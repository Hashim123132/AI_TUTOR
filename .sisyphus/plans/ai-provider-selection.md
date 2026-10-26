# Plan: Dynamic AI Provider Selection (Teacher Shneela | Groq)

## Context (verified by inspection)

- **Backend**: FastAPI at `backend/` (Python 3.13, uv). Auth = Bearer token verified against Supabase GoTrue (`app/auth.py:require_user`). Service-role Supabase client in `app/services/profiles.py:get_admin_client`.
- **`POST /api/generate` today**: unauthenticated; proxies to HF Space `https://hashimumar-nosheen-hina.hf.space` (Gradio queue), 300s timeout. Schema: `prompt` (1–1024), `max_new_tokens` (1–350, default 200) → `GenerateResponse{prompt, generated_text, tokens_generated}`.
- **Custom model**: `app/ml/model.py` (Nosheen_Hina char-level transformer, BLOCK_SIZE=256) is the model definition; commit `6d154b5` moved *inference* to the HF Space and removed `torch`/`huggingface-hub` from `pyproject.toml`. Checkpoint `backend/models/nosheen_hina_best.pt` is gitignored (`*.pt` in root `.gitignore`); HF Space pulls from Hub repo `HashimUmar/nosheen-hina-model`.
- **Groq**: no integration exists anywhere. `openai==3.37.0` **is** installed; no `groq` package. OpenAI SDK works with `base_url="https://api.groq.com/openai/v1"`; exposes `RateLimitError`, `APITimeoutError`, `APIConnectionError`, `APIStatusError`.
- **Groq model IDs (live docs, Oct 2026)**: `llama-3.3-70b-versatile` and `llama-3.1-8b-instant` were **deprecated with shutdown 2026-08-16** (already past). Current production replacements: `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.6-27b`. Default will be `openai/gpt-oss-120b`, overridable via `GROQ_MODEL`.
- **Frontend**: Next.js 16 (app router, `src/proxy.ts` middleware guards routes), Supabase SSR cookies, server actions pattern (`lib/onboarding/actions.ts`), design system = shadcn-ish primitives in `src/components/ui/*` + `brand` color tokens. **No Settings page exists**; **tutor page is a placeholder** (`PlaceholderPage`).
- **Supabase**: one migration creating `profiles` + `subjects` with full RLS (own-row policies for authenticated). `profiles` has `updated_at` trigger and grants for authenticated + service_role.
- **User decisions**: Teacher Shneela = **HF Space proxy** (reuse current client logic, no torch re-add). Groq client = **installed OpenAI SDK** (no new deps).

## Design decisions

| Decision | Choice | Rationale |
|---|---|---|
| Preference storage | New column `profiles.ai_provider text not null default 'teacher_shneela'` with CHECK | Reuses existing table + existing RLS policies; default backfills all existing rows |
| Settings read/write path | Next.js server action + RLS-scoped Supabase client (like onboarding) | No new backend endpoints; RLS genuinely enforces own-row writes |
| Generation routing | Backend resolves provider from DB using verified user id from Bearer token | Frontend cannot spoof provider; token is the only identity input |
| `/api/generate` auth | Now requires Bearer token (previously public) | Required to resolve the student's saved provider |
| Groq client | `openai.OpenAI(api_key, base_url="https://api.groq.com/openai/v1", timeout, max_retries=0)` | Zero new deps; we handle errors explicitly, no hidden retries |
| Chat transport | Server action `askTutor` → backend fetch | Keeps access token server-side (never in client bundle/localStorage) |
| Error policy | Never fall back to the other provider; structured error `{code, message, provider}` + chat UI offers Retry / switch in Settings | Per requirements |
| Onboarding gate | Chat works for any authenticated user; provider defaults to `teacher_shneela` when no profile row | Settings save requires a profile row (clear error otherwise) |

## Changes

### 1. Database migration (new file)

`supabase/migrations/20261027000001_add_profile_ai_provider.sql`

```sql
alter table public.profiles
  add column ai_provider text not null default 'teacher_shneela';

alter table public.profiles
  add constraint profiles_ai_provider_check
  check (ai_provider in ('teacher_shneela', 'groq'));
```

- No RLS changes needed: existing `profiles_select_own` / `profiles_update_own` policies already cover the column; `updated_at` trigger fires automatically; grants already include `service_role` (backend reads).
- Apply with `supabase db push` (project linked in `supabase/.temp/linked-project.json`) or paste in the SQL editor.

### 2. Backend — config (`backend/app/config.py`)

Add settings (all optional except defaults):

- `groq_api_key: str | None` (blank→unset via existing validator)
- `groq_model: str = "openai/gpt-oss-120b"`
- `groq_timeout_seconds: float = 30.0`
- `groq_max_retries: int = 0`
- `teacher_shneela_space_url: str = "https://hashimumar-nosheen-hina.hf.space"` (replaces hardcoded constant)
- `teacher_shneela_timeout_seconds: float = 300.0` (preserves existing 300s)
- `@property groq_configured -> bool`

### 3. Backend — provider services (new)

`backend/app/services/teacher_shneela.py` — move the existing HF Space Gradio client logic out of `api/generate.py` verbatim (queue POST → event_id → SSE GET parse). Public function `generate(prompt, max_new_tokens, space_url, timeout) -> str`. Raises a small `TeacherShneelaError` ( subclasses: `TeacherShneelaTimeout`, `TeacherShneelaUnavailable` ). Same safeguards (invalid response → error, no silent success).

`backend/app/services/groq_provider.py` — sync OpenAI client against Groq base URL, `max_retries=0`, per-request `chat.completions.create(model, max_tokens=max_new_tokens, messages=[system, user])`. Short tutoring system prompt. Maps SDK errors → `GroqError` hierarchy: `GroqNotConfigured`, `GroqTimeout`, `GroqRateLimited`, `GroqAuthError`, `GroqUnavailable`. Clamps `max_new_tokens` to the same 1–350 range.

`backend/app/services/tutoring.py` — shared tutoring-generation service:

- `Provider = Literal["teacher_shneela", "groq"]`, `DEFAULT_PROVIDER = "teacher_shneela"`
- `resolve_provider(user_id) -> Provider`: service-role client, `select ai_provider from profiles where user_id = ...`; missing row/null/invalid value → default (log warning). Store errors raise `PreferenceStoreError`.
- `generate_answer(user_id, prompt, max_new_tokens) -> tuple[str, Provider]`: resolve → dispatch to exactly one provider → never fall back. Raises typed exceptions carrying the provider id.
- Exception → HTTP mapping helper used by the router:
  - `PreferenceStoreError` → 503 `{"code":"preference_store_unavailable", ...}`
  - `GroqNotConfigured` → 503 `{"code":"provider_not_configured", provider:"groq"}` with a student-safe message (never leak key material)
  - `*Timeout*` → 504 `{"code":"provider_timeout"}`
  - `GroqRateLimited` → 429 `{"code":"provider_rate_limited"}`
  - `GroqAuthError` → 503 `{"code":"provider_misconfigured"}`
  - other provider errors → 502 `{"code":"provider_error"}`
  - detail always includes `provider` and a human message telling the user to retry or switch provider in Settings.

### 4. Backend — schemas & route

`backend/app/schemas/generate.py`: keep `GenerateRequest` exactly (1–1024 prompt, 1–350 max_new_tokens, default 200 — preserves model safeguards). Add `provider: str` to `GenerateResponse` (additive, both providers share one response shape).

`backend/app/api/generate.py`: rewrite `post_generate` to:

1. `user = require_user(authorization)` (401 without valid Bearer token)
2. call `tutoring.generate_answer(user.id, body.prompt, body.max_new_tokens)`
3. return `GenerateResponse(prompt, generated_text, tokens_generated, provider)` where `generated_text` for Teacher Shneela keeps the existing full-output semantics (prompt + continuation) and for Groq is the completion text; `tokens_generated` keeps the existing `max(0, len(generated)-len(prompt))` character-delta convention for both.
4. Map typed exceptions to the structured HTTP errors above.

`backend/app/main.py`: in `log_startup_config()` add a warning when `not settings.groq_configured` ("provider 'groq' will return 503 until GROQ_API_KEY is set"). No model warm-up (torch intentionally absent). CORS/auth/routes untouched.

### 5. Backend — env & docs

`backend/.env.example`: append (names only):

```
# Groq (hosted LLM). Backend secret only — NEVER expose to the browser.
GROQ_API_KEY=
# Supported production model id; override when Groq retires a model.
GROQ_MODEL=openai/gpt-oss-120b
GROQ_TIMEOUT_SECONDS=30
GROQ_MAX_RETRIES=0
# Teacher Shneela serving endpoint (HF Space running the custom PyTorch model)
TEACHER_SHNEELA_SPACE_URL=https://hashimumar-nosheen-hina.hf.space
TEACHER_SHNEELA_TIMEOUT_SECONDS=300
```

`backend/pyproject.toml`: **no changes** (openai already declared). Note in README that torch is deliberately not a backend dependency.

`backend/README.md` (currently empty — user explicitly requested documentation): env vars table, migration steps, local run, deployment notes + limitations (see §8).

### 6. Frontend — Settings

- `src/lib/settings/constants.ts` (new): `type AiProvider = "teacher_shneela" | "groq"`, `AI_PROVIDER_OPTIONS` (value, label, description, badge copy), `DEFAULT_AI_PROVIDER`.
- `src/lib/settings/actions.ts` (new, `"use server"`): `saveAiProvider(prev, formData)`:
  - `requireUser()`; validate `provider` against the allowed set (422-style friendly message otherwise)
  - `select user_id from profiles` — if no row → `{ok:false, code:"profile_required", message:"Finish onboarding before changing your AI provider."}`
  - `update profiles set ai_provider=... where user_id=...` (RLS-scoped) → `{ok:true, provider}` or `{ok:false, message:"Could not save your preference. Try again."}`
- `src/app/(app)/settings/page.tsx` (new): server component — `requireUser()`, `select ai_provider` (fallback default), render `PageHeader("Settings")` + `<AiProviderSettings initialProvider={...} />`.
- `src/components/settings/ai-provider-settings.tsx` (new, client): Card titled "AI Provider" with two radio-card options (real `<input type="radio">` inside `<label>` for a11y, styled with existing Card/Badge tokens), each with description and an "Active" badge on the selected one. On change → `useTransition` + server action. States: saving (inputs disabled + spinner), saved (success badge, auto-clear ~2s), error (destructive text, selection reverted). Responsive single-column on mobile / two-up on `sm:`.
- `src/components/layout/nav-config.ts`: append `{ label: "Settings", href: "/settings", icon: SettingsIcon, description: "Preferences and AI provider" }` (sidebar + mobile nav both render `navItems`).

### 7. Frontend — Tutor chat (routes through the saved provider)

- `src/lib/api/generate.ts` (new, `"use server"`-safe fetch helper, mirrors `lib/api/dashboard.ts`): `askTutorBackend(accessToken, prompt, maxNewTokens?)` → POST `${apiUrl}/api/generate` with Bearer header, 60s `AbortSignal.timeout` (longer than dashboard; model can be slow), parses success payload or structured error detail into a typed result `{kind:"ok"|'error'|'unauthorized', ...}`.
- `src/lib/tutor/actions.ts` (new, `"use server"`): `askTutor(prompt)` — `requireUser()`, trims/validates prompt (1–1024 chars), calls the fetch helper, returns typed result (never throws to the client).
- `src/components/tutor/tutor-chat.tsx` (new, client): message list (user/assistant bubbles using Card/Badge tokens), input + send Button, `useTransition` pending state, per-message provider badge, error panel with **Retry** (re-send last prompt) and **Switch provider** link → `/settings`. Empty state reuses `EmptyState`. History lives in component state only (no persistence requirement).
- `src/app/(app)/tutor/page.tsx`: replace `PlaceholderPage` with `PageHeader` + active-provider indicator (from `profiles.ai_provider`) + `<TutorChat />`. Keep `requireUser()`.

### 8. No changes to

Dashboard, onboarding, auth, `proxy.ts`, CORS list, existing migrations, `app/ml/model.py` (model definition & checkpoint loader untouched), `backend/models/*` (stays gitignored), frontend env files (no new frontend vars needed).

## Verification (after plan approval — user said do not run lint/tests/builds yet)

1. `supabase db push` (or SQL editor) → confirm `profiles.ai_provider` exists, default applied to existing rows.
2. `cd backend && uv run uvicorn app.main:app` with `GROQ_API_KEY` set → `POST /api/generate` with a real Supabase token for each provider; verify 401 without token, structured errors with Space stopped / bad key.
3. `cd frontend && npm run dev` → Settings: switch provider, refresh, confirm persistence; Tutor: ask a question, confirm answer provider badge matches selection; stop backend → confirm chat error + Retry UI.
4. Later (not now): `npm run lint`, `uv run pytest`.

## Deliverable report checklist (to include in final response)

1. Files created/modified (list below)
2. Migration requirement: run `20261027000001_add_profile_ai_provider.sql`
3. Env vars: `GROQ_API_KEY` (required for groq), `GROQ_MODEL`, `GROQ_TIMEOUT_SECONDS`, `GROQ_MAX_RETRIES`, `TEACHER_SHNEELA_SPACE_URL`, `TEACHER_SHNEELA_TIMEOUT_SECONDS`
4. Flow: Settings radio → server action → RLS update on `profiles.ai_provider` → chat send → server action → `POST /api/generate` (Bearer) → backend verifies token with GoTrue → reads `profiles.ai_provider` via service role → routes to HF Space or Groq → uniform `GenerateResponse` + provider field → chat renders.
5. Manual steps/blockers: apply migration; set `GROQ_API_KEY` in backend host secrets (console.groq.com); HF Space must stay up (single point of failure for Teacher Shneela; free-tier cold starts mitigated by 300s timeout); backend host needs outbound HTTPS to the Space + `api.groq.com`; add any new frontend domain to the CORS allow-list in `backend/app/main.py` when deploying; checkpoint never ships with the backend (Space/Hub owns it); in-process torch remains infeasible on serverless (documented, not changed).

## File inventory

**Create**
- `supabase/migrations/20261027000001_add_profile_ai_provider.sql`
- `backend/app/services/teacher_shneela.py`
- `backend/app/services/groq_provider.py`
- `backend/app/services/tutoring.py`
- `backend/README.md` (docs)
- `frontend/src/lib/settings/constants.ts`
- `frontend/src/lib/settings/actions.ts`
- `frontend/src/app/(app)/settings/page.tsx`
- `frontend/src/components/settings/ai-provider-settings.tsx`
- `frontend/src/lib/api/generate.ts`
- `frontend/src/lib/tutor/actions.ts`
- `frontend/src/components/tutor/tutor-chat.tsx`

**Modify**
- `backend/app/config.py`
- `backend/app/api/generate.py`
- `backend/app/schemas/generate.py`
- `backend/app/main.py`
- `backend/.env.example`
- `frontend/src/app/(app)/tutor/page.tsx`
- `frontend/src/components/layout/nav-config.ts`
