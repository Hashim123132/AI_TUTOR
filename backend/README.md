# AI Learning Tutor — Backend (FastAPI)

Tutoring API for the AI Learning Tutor. Students pick an AI provider in
Settings; generation requests are routed to that provider server-side.

## AI providers

| Provider id | What it is | How it runs |
|---|---|---|
| `teacher_shneela` (default) | Custom Nosheen_Hina character-level PyTorch transformer ("Teacher Shneela") | Served by the Hugging Face Space in `TEACHER_SHNEELA_SPACE_URL`; the backend is a client (`app/services/teacher_shneela.py`). The `.pt` checkpoint is **not** part of this repo or deploy bundle — it lives with the Space / Hugging Face Hub (`HashimUmar/nosheen-hina-model`). `app/ml/model.py` defines the architecture and stays as the model source. |
| `groq` | Hosted LLM via the Groq API | `app/services/groq_provider.py` calls Groq's OpenAI-compatible endpoint using the installed `openai` SDK. Model id comes from `GROQ_MODEL`. |

Routing lives in `app/services/tutoring.py`: the provider is read from the
student's `profiles.ai_provider` row in Supabase, keyed by the user id
verified from the Bearer token (GoTrue). The request body cannot choose a
provider, and a failing provider is **never** silently replaced — errors
name the provider and the student can retry or switch in Settings.

## Environment variables

Copy `.env.example` to `.env` and fill in values (never commit `.env`).

| Variable | Required | Purpose |
|---|---|---|
| `SUPABASE_URL` | Yes | Supabase project URL (auth introspection + profile reads) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Backend-only service-role key. Never expose to the browser |
| `DASHBOARD_DEMO_MODE` | No (`false`) | Dev-only sample dashboard data. Never enable in production |
| `GROQ_API_KEY` | For the `groq` provider | Groq API key (console.groq.com). Backend secret only |
| `GROQ_MODEL` | No (`openai/gpt-oss-120b`) | Groq production model id; override when Groq retires models |
| `GROQ_TIMEOUT_SECONDS` | No (`30`) | Per-request Groq timeout |
| `GROQ_MAX_RETRIES` | No (`0`) | SDK-level retries; `0` surfaces errors immediately |
| `TEACHER_SHNEELA_SPACE_URL` | No | HF Space serving the custom model |
| `TEACHER_SHNEELA_TIMEOUT_SECONDS` | No (`300`) | Space timeout (covers free-tier cold starts) |

Notes:

- Secrets (`SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`) belong only in the
  backend host's environment. The frontend only ever sees the Supabase anon
  key and the student's own access token.
- Without `GROQ_API_KEY`, Teacher Shneela still works; students who select
  Groq receive a clear `503 provider_not_configured` error.
- PyTorch is intentionally **not** a backend dependency (inference runs on
  the HF Space). Do not add `torch` unless you also plan container hosting —
  it will not fit typical serverless bundles.

## Database migration

The provider preference is `profiles.ai_provider`
(`teacher_shneela` | `groq`, default `teacher_shneela`). Apply the migration
from the repo root:

```bash
supabase db push
# or paste supabase/migrations/20261027000001_add_profile_ai_provider.sql
# into the hosted SQL editor
```

Existing RLS policies already limit reads/writes to the owning user
(`profiles_select_own`, `profiles_update_own`); the backend reads the column
with the service-role client, always scoped by the verified user id.

## Run locally

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
# API docs: http://127.0.0.1:8000/docs
```

`POST /api/generate` requires `Authorization: Bearer <supabase access token>`.

## API summary

| Route | Auth | Notes |
|---|---|---|
| `GET /api/health` | No | Liveness |
| `GET /api/dashboard` | Bearer | Dashboard payload; `404 onboarding_required` |
| `POST /api/generate` | Bearer | `{prompt, max_new_tokens?}` → `{prompt, generated_text, tokens_generated, provider}` |

Generate error shape (structured `detail`):

```json
{ "code": "provider_timeout", "message": "...", "provider": "groq", "provider_label": "Groq" }
```

Codes: `provider_not_configured` (503), `provider_timeout` (504),
`provider_rate_limited` (429), `provider_misconfigured` (503),
`provider_error` (502), `preference_store_unavailable` (503).

## Deployment notes & limitations

- The backend needs **outbound HTTPS** to the HF Space and
  `api.groq.com`.
- Teacher Shneela availability equals the HF Space's availability (single
  point of failure; free-tier cold starts are covered by the 300s timeout).
- Running the PyTorch model in-process would require re-adding `torch`
  (~1–2 GB with CPU wheels) plus checkpoint provisioning — not viable on
  typical serverless hosts; keep inference on the Space or move to container
  hosting if that ever changes.
- Add each production frontend origin to the CORS allow-list in
  `app/main.py` before deploying a new domain.
- Set `GROQ_API_KEY` in the backend host's secrets (and rotate it if it ever
  leaked). Students never enter API keys.
