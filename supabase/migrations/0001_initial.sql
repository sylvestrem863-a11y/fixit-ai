create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.problems (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  category text,
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status text not null default 'open' check (status in ('open','in_progress','resolved','archived')),
  ai_analysis jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.action_items (
  id uuid primary key default gen_random_uuid(), problem_id uuid not null references public.problems(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, title text not null, description text,
  position integer not null default 0, completed boolean not null default false, due_date date, created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(), problem_id uuid not null references public.problems(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, content text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(), problem_id uuid not null references public.problems(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, file_name text not null, storage_path text not null,
  mime_type text, size_bytes bigint, created_at timestamptz not null default now()
);

create table if not exists public.problem_history (
  id uuid primary key default gen_random_uuid(), problem_id uuid not null references public.problems(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, event_type text not null, metadata jsonb, created_at timestamptz not null default now()
);

create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid references public.problems(id) on delete cascade, model text, prompt_version text,
  input_tokens integer, output_tokens integer, result jsonb, created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.problems enable row level security;
alter table public.action_items enable row level security;
alter table public.notes enable row level security;
alter table public.documents enable row level security;
alter table public.problem_history enable row level security;
alter table public.ai_generations enable row level security;

create policy "profiles own data" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "problems own data" on public.problems for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "actions own data" on public.action_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notes own data" on public.notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "documents own data" on public.documents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "history own data" on public.problem_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ai generations own data" on public.ai_generations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists problems_user_id_idx on public.problems(user_id);
create index if not exists action_items_problem_id_idx on public.action_items(problem_id);
create index if not exists documents_problem_id_idx on public.documents(problem_id);
create index if not exists history_problem_id_idx on public.problem_history(problem_id);
create index if not exists ai_generations_problem_id_idx on public.ai_generations(problem_id);