-- Resumes generated from the Chrome extension: one row per generation.
-- /api/generate-resume inserts them and /resume/[id]/print renders `result`.
-- Kept apart from `resumes`, which holds each user's single profile row
-- (see syncProfileToSupabase in src/lib/profile.ts).

create table if not exists public.tailored_resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_title text not null default '',
  company text,
  page_url text,
  jd_source_text text not null default '',
  jd_parsed jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists tailored_resumes_user_id_created_at_idx
  on public.tailored_resumes (user_id, created_at desc);

alter table public.tailored_resumes enable row level security;

-- The API runs as the signed-in user (anon key + their JWT), so RLS is the access check.
create policy "Users read their own tailored resumes"
  on public.tailored_resumes for select
  using ((select auth.uid()) = user_id);

create policy "Users create their own tailored resumes"
  on public.tailored_resumes for insert
  with check ((select auth.uid()) = user_id);

create policy "Users delete their own tailored resumes"
  on public.tailored_resumes for delete
  using ((select auth.uid()) = user_id);
