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

create table if not exists public.integration_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_email text,
  provider_user_id text,
  access_token text,
  refresh_token text,
  scopes text[] not null default '{}',
  status text not null default 'connected',
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists public.calendar_event_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_item_type text not null,
  local_item_id text not null,
  google_event_id text not null,
  last_synced_fingerprint text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, local_item_type, local_item_id)
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null,
  item_type text not null,
  item_id text not null,
  occurrence_at timestamptz not null,
  status text not null,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, channel, item_type, item_id, occurrence_at)
);

alter table public.pawfolio_snapshots enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.integration_accounts enable row level security;
alter table public.calendar_event_links enable row level security;
alter table public.notification_deliveries enable row level security;

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

drop policy if exists "Users can read own integration accounts" on public.integration_accounts;
create policy "Users can read own integration accounts"
on public.integration_accounts for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own integration accounts" on public.integration_accounts;
create policy "Users can insert own integration accounts"
on public.integration_accounts for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own integration accounts" on public.integration_accounts;
create policy "Users can update own integration accounts"
on public.integration_accounts for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can read own calendar event links" on public.calendar_event_links;
create policy "Users can read own calendar event links"
on public.calendar_event_links for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own calendar event links" on public.calendar_event_links;
create policy "Users can insert own calendar event links"
on public.calendar_event_links for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own calendar event links" on public.calendar_event_links;
create policy "Users can update own calendar event links"
on public.calendar_event_links for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own calendar event links" on public.calendar_event_links;
create policy "Users can delete own calendar event links"
on public.calendar_event_links for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read own notification deliveries" on public.notification_deliveries;
create policy "Users can read own notification deliveries"
on public.notification_deliveries for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own notification deliveries" on public.notification_deliveries;
create policy "Users can insert own notification deliveries"
on public.notification_deliveries for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own notification deliveries" on public.notification_deliveries;
create policy "Users can update own notification deliveries"
on public.notification_deliveries for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own notification deliveries" on public.notification_deliveries;
create policy "Users can delete own notification deliveries"
on public.notification_deliveries for delete
using (auth.uid() = user_id);
