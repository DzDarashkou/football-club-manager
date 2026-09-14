-- A club team can play in multiple competition groups in the same season.
create table public.team_competition_groups (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete restrict,
  season_id uuid not null references public.seasons(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 250),
  external_play_id uuid,
  created_at timestamptz not null default now(),
  unique (team_id, season_id, name),
  unique (team_id, season_id, external_play_id)
);

create table public.standings_snapshots (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.team_competition_groups(id) on delete restrict,
  imported_at timestamptz not null default clock_timestamp(),
  imported_by uuid references public.profiles(id) on delete set null,
  external_team_id uuid not null,
  table_data jsonb not null check (
    jsonb_typeof(table_data) = 'object'
    and table_data ?& array['league', 'play', 'rows']
    and jsonb_typeof(table_data->'rows') = 'array'
  )
);
create index standings_snapshots_history_idx on public.standings_snapshots(group_id, imported_at desc, id desc);

alter table public.team_competition_groups enable row level security;
alter table public.standings_snapshots enable row level security;

create policy "Active members read competition groups" on public.team_competition_groups
for select to authenticated using (exists (
  select 1 from public.profiles where id = auth.uid() and status = 'active' and role in ('admin', 'coach', 'parent')
));
create policy "Active admins create competition groups" on public.team_competition_groups
for insert to authenticated with check (public.current_app_is_active_admin());
create policy "Active members read standings history" on public.standings_snapshots
for select to authenticated using (exists (
  select 1 from public.profiles where id = auth.uid() and status = 'active' and role in ('admin', 'coach', 'parent')
));

-- Snapshots are append-only through the import function, never an upsert.
revoke all on public.standings_snapshots from anon, authenticated;
grant select on public.standings_snapshots to authenticated;
revoke all on public.team_competition_groups from anon, authenticated;
grant select, insert on public.team_competition_groups to authenticated;
grant all on public.team_competition_groups, public.standings_snapshots to service_role;

create function public.import_standings_snapshot(p_group_id uuid, p_actor_id uuid, p_external_team_id uuid, p_table jsonb)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  selected_group public.team_competition_groups%rowtype;
  play_id uuid;
  snapshot_id uuid;
begin
  if not exists (select 1 from public.profiles where id = p_actor_id and role = 'admin' and status = 'active') then
    raise exception 'An active administrator is required.' using errcode = '42501';
  end if;
  select * into selected_group from public.team_competition_groups where id = p_group_id for update;
  if not found then raise exception 'Competition group not found.' using errcode = 'P0002'; end if;
  play_id := (p_table->'play'->>'id')::uuid;
  if play_id is null or jsonb_typeof(p_table->'rows') is distinct from 'array' then
    raise exception 'Invalid standings data.' using errcode = '22023';
  end if;
  if selected_group.external_play_id is not null and selected_group.external_play_id <> play_id then
    raise exception 'This JSON belongs to a different competition group.' using errcode = '22023';
  end if;
  if not exists (select 1 from jsonb_array_elements(p_table->'rows') as entry(value) where entry.value->'team'->>'id' = p_external_team_id::text) then
    raise exception 'The selected team is missing from the table.' using errcode = '22023';
  end if;
  update public.team_competition_groups set external_play_id = play_id where id = p_group_id;
  insert into public.standings_snapshots(group_id, imported_by, external_team_id, table_data)
  values (p_group_id, p_actor_id, p_external_team_id, p_table) returning id into snapshot_id;
  return snapshot_id;
end;
$$;
revoke all on function public.import_standings_snapshot(uuid, uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.import_standings_snapshot(uuid, uuid, uuid, jsonb) to service_role;

-- Attach the requested initial groups when matching teams and an active season
-- already exist. Other installations can add these through the admin form.
with initial_groups(team_name, group_name, play_id) as (
  values
    ('sporting wroclaw 2', 'Wrocław: IV liga okręgowa D2 Młodzik Grupa 1', null::uuid),
    ('sporting wroclaw 1', 'Wrocław: III liga okręgowa D2 Młodzik', '6b323b16-45f4-4f75-b3dd-d9b04b5c373c'::uuid),
    ('sporting wroclaw 1', 'Wrocław: V liga okręgowa D1 Młodzik Grupa 1', null::uuid)
), current_season as (
  select id from public.seasons where is_active order by starts_on desc, id limit 1
)
insert into public.team_competition_groups(team_id, season_id, name, external_play_id)
select teams.id, current_season.id, initial_groups.group_name, initial_groups.play_id
from initial_groups join public.teams on replace(lower(trim(teams.name)), 'ł', 'l') = initial_groups.team_name
cross join current_season
on conflict do nothing;
