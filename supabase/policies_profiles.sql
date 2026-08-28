-- Row Level Security for public.profiles
-- Run this in the Supabase SQL editor (or via `supabase db push` once you adopt the CLI).

alter table public.profiles enable row level security;

-- Lets the app's bootstrap upsert (app/_layout.tsx) create the row on first anonymous sign-in.
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

-- Needed to read back streak/history data for the signed-in user.
create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

-- Needed when the app updates streak/history fields after a quiz answer.
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
