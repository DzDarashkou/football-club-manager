-- A player can represent more than one team. Preserve every existing assignment
-- before removing the former one-to-many players.team_id relationship.
create table public.player_teams (
  player_id uuid not null references public.players (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (player_id, team_id)
);

insert into public.player_teams (player_id, team_id)
select id, team_id
from public.players;

create index player_teams_team_id_idx on public.player_teams (team_id);

alter table public.player_teams enable row level security;

create policy "Active admins can manage player teams"
on public.player_teams
for all to authenticated
using (public.current_app_is_active_admin())
with check (public.current_app_is_active_admin());

drop index public.players_team_shirt_number_key;
drop index public.players_team_id_idx;
alter table public.players drop constraint players_team_id_fkey;
alter table public.players drop column team_id;
