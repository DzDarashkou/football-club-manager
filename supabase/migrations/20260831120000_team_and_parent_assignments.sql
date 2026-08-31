-- Required relationship foundations for game attendance and coach-scoped access.
create table public.coach_teams (
  coach_id uuid not null references public.profiles (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (coach_id, team_id)
);

create table public.player_parents (
  player_id uuid not null references public.players (id) on delete cascade,
  parent_id uuid not null references public.profiles (id) on delete cascade,
  relationship_label text,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (player_id, parent_id)
);

create index coach_teams_team_id_idx on public.coach_teams (team_id);
create index player_parents_parent_id_idx on public.player_parents (parent_id);

alter table public.coach_teams enable row level security;
alter table public.player_parents enable row level security;

create policy "Active admins can manage coach teams"
on public.coach_teams
for all to authenticated
using (public.current_app_is_active_admin())
with check (public.current_app_is_active_admin());

create policy "Active admins can manage player parents"
on public.player_parents
for all to authenticated
using (public.current_app_is_active_admin())
with check (public.current_app_is_active_admin());
