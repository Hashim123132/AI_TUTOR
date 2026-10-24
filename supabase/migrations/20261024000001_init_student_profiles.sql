-- Student profiles and onboarding data.
-- Every row belongs to exactly one auth.users record; RLS policies below
-- restrict access to the owning user (auth.uid() = user_id).

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 100),
  education_level text not null
    check (
      education_level in (
        'middle_school',
        'high_school',
        'undergraduate',
        'graduate',
        'professional',
        'self_taught'
      )
    ),
  goal text check (goal is null or char_length(goal) between 10 and 500),
  target_deadline date,
  study_days text[] not null default '{}'
    check (
      cardinality(study_days) between 0 and 7
      and study_days <@ array[
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
      ]
    ),
  study_minutes_per_day int
    check (study_minutes_per_day is null or study_minutes_per_day between 10 and 480),
  preferred_methods text[] not null default '{}'
    check (
      cardinality(preferred_methods) <= 4
      and preferred_methods <@ array['reading', 'videos', 'explanations', 'quizzes']
    ),
  current_step int not null default 1 check (current_step between 1 and 6),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint onboarding_complete_requires_answers check (
    onboarding_completed_at is null
    or (
      goal is not null
      and target_deadline is not null
      and cardinality(study_days) >= 1
      and study_minutes_per_day is not null
      and cardinality(preferred_methods) >= 1
    )
  )
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  knowledge_level text
    check (knowledge_level is null or knowledge_level in ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index subjects_user_id_lower_name_key
  on public.subjects (user_id, lower(name));

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_handle_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger subjects_handle_updated_at
  before update on public.subjects
  for each row execute function public.handle_updated_at();

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "profiles_delete_own"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "subjects_select_own"
  on public.subjects for select
  to authenticated
  using (auth.uid() = user_id);

create policy "subjects_insert_own"
  on public.subjects for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "subjects_update_own"
  on public.subjects for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "subjects_delete_own"
  on public.subjects for delete
  to authenticated
  using (auth.uid() = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated, service_role;
grant select, insert, update, delete on public.subjects to authenticated, service_role;
revoke all on public.profiles from anon;
revoke all on public.subjects from anon;
