-- Pawfolio cloud foundation: Supabase Auth + private user data.
-- Run this in the Supabase SQL editor after creating the project.

create table if not exists public.pawfolio_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  local_storage_key text not null default 'pawfolio-local-v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pawfolio_snapshots enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists "Users can read own Pawfolio snapshot" on public.pawfolio_snapshots;
create policy "Users can read own Pawfolio snapshot"
on public.pawfolio_snapshots for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own Pawfolio snapshot" on public.pawfolio_snapshots;
create policy "Users can insert own Pawfolio snapshot"
on public.pawfolio_snapshots for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own Pawfolio snapshot" on public.pawfolio_snapshots;
create policy "Users can update own Pawfolio snapshot"
on public.pawfolio_snapshots for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can read own push subscriptions" on public.push_subscriptions;
create policy "Users can read own push subscriptions"
on public.push_subscriptions for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own push subscriptions" on public.push_subscriptions;
create policy "Users can insert own push subscriptions"
on public.push_subscriptions for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own push subscriptions" on public.push_subscriptions;
create policy "Users can update own push subscriptions"
on public.push_subscriptions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
