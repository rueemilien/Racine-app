-- user_settings: per-user notification preference, source of truth for the daily reminder time.
-- Run this in the Supabase SQL editor (or via `supabase db push` once you adopt the CLI).

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notification_hour smallint not null default 8 check (notification_hour between 0 and 23),
  notification_minute smallint not null default 0 check (notification_minute between 0 and 59),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "Users can view their own settings"
on public.user_settings
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own settings"
on public.user_settings
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own settings"
on public.user_settings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
