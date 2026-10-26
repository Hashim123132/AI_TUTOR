-- Per-student AI provider preference.
-- 'teacher_shneela' = the custom Nosheen_Hina PyTorch model served by the
-- Hugging Face Space; 'groq' = hosted LLM via the Groq API.
-- The NOT NULL DEFAULT backfills every existing profile row, so current and
-- new users both start on Teacher Shneela.
-- Existing RLS policies (profiles_select_own / profiles_update_own) already
-- restrict reads and writes to the owning user; no policy changes needed.

alter table public.profiles
  add column ai_provider text not null default 'teacher_shneela';

alter table public.profiles
  add constraint profiles_ai_provider_check
  check (ai_provider in ('teacher_shneela', 'groq'));
