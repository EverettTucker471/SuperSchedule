-- SuperSchedule initial schema
-- Apply in the Supabase SQL editor or via the CLI after creating a project.
-- Does not require live credentials to exist in this repo.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'App profile row, 1:1 with auth.users.';

-- ---------------------------------------------------------------------------
-- calendar_events (imported from Google Calendar)
-- ---------------------------------------------------------------------------
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  google_event_id text not null,
  title text not null default '',
  description text,
  location text,
  start_at timestamptz,
  end_at timestamptz,
  all_day boolean not null default false,
  raw jsonb,
  imported_at timestamptz not null default now(),
  unique (user_id, google_event_id)
);

create index if not exists calendar_events_user_id_start_at_idx
  on public.calendar_events (user_id, start_at);

comment on table public.calendar_events is 'Google Calendar events imported for a user.';

-- ---------------------------------------------------------------------------
-- scheduling_preferences
-- ---------------------------------------------------------------------------
create table if not exists public.scheduling_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  sleep_start time,
  sleep_end time,
  commute_mode text not null default 'walk',
  commute_minutes integer not null default 0,
  meal_plan jsonb not null default '{}'::jsonb,
  clubs jsonb not null default '[]'::jsonb,
  workouts jsonb not null default '[]'::jsonb,
  other_constraints jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.scheduling_preferences is 'Lifestyle constraints used by the (future) optimizer.';

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists scheduling_preferences_set_updated_at on public.scheduling_preferences;
create trigger scheduling_preferences_set_updated_at
  before update on public.scheduling_preferences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- create profile on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.calendar_events enable row level security;
alter table public.scheduling_preferences enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "calendar_events_select_own" on public.calendar_events;
create policy "calendar_events_select_own"
  on public.calendar_events for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "calendar_events_insert_own" on public.calendar_events;
create policy "calendar_events_insert_own"
  on public.calendar_events for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "calendar_events_update_own" on public.calendar_events;
create policy "calendar_events_update_own"
  on public.calendar_events for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "calendar_events_delete_own" on public.calendar_events;
create policy "calendar_events_delete_own"
  on public.calendar_events for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "scheduling_preferences_select_own" on public.scheduling_preferences;
create policy "scheduling_preferences_select_own"
  on public.scheduling_preferences for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "scheduling_preferences_insert_own" on public.scheduling_preferences;
create policy "scheduling_preferences_insert_own"
  on public.scheduling_preferences for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "scheduling_preferences_update_own" on public.scheduling_preferences;
create policy "scheduling_preferences_update_own"
  on public.scheduling_preferences for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "scheduling_preferences_delete_own" on public.scheduling_preferences;
create policy "scheduling_preferences_delete_own"
  on public.scheduling_preferences for delete
  to authenticated
  using (user_id = auth.uid());

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.calendar_events to authenticated;
grant select, insert, update, delete on public.scheduling_preferences to authenticated;
