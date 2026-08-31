create table public.age_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  birth_year_from smallint not null,
  birth_year_to smallint not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint age_groups_name_key unique (name),
  constraint age_groups_birth_year_range_check check (
    birth_year_from between 1900 and 2100
    and birth_year_to between birth_year_from and 2100
  )
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age_group_id uuid not null references public.age_groups (id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint teams_age_group_name_key unique (age_group_id, name)
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  date_of_birth date not null,
  team_id uuid not null references public.teams (id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint players_date_of_birth_check check (date_of_birth between date '1900-01-01' and current_date)
);

create index teams_age_group_id_idx on public.teams (age_group_id);
create index players_team_id_idx on public.players (team_id);
create index players_full_name_idx on public.players (full_name);

create trigger set_age_groups_updated_at
before update on public.age_groups
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_teams_updated_at
before update on public.teams
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_players_updated_at
before update on public.players
for each row execute function public.set_current_timestamp_updated_at();

create or replace function public.current_app_is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  )
$$;

revoke all on function public.current_app_is_active_admin() from public;
grant execute on function public.current_app_is_active_admin() to authenticated;

alter table public.age_groups enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;

create policy "Active admins can manage age groups"
on public.age_groups
for all to authenticated
using (public.current_app_is_active_admin())
with check (public.current_app_is_active_admin());

create policy "Active admins can manage teams"
on public.teams
for all to authenticated
using (public.current_app_is_active_admin())
with check (public.current_app_is_active_admin());

create policy "Active admins can manage players"
on public.players
for all to authenticated
using (public.current_app_is_active_admin())
with check (public.current_app_is_active_admin());
