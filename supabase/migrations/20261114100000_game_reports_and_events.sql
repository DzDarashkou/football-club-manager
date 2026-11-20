-- Phase 1: Match report fields on games, lineup_line on game_players, and game_events timeline

alter table public.games
  add column if not exists home_possession smallint
    check (home_possession is null or (home_possession >= 0 and home_possession <= 100)),
  add column if not exists away_possession smallint
    check (away_possession is null or (away_possession >= 0 and away_possession <= 100)),
  add column if not exists halftime_home_score smallint
    check (halftime_home_score is null or halftime_home_score >= 0),
  add column if not exists halftime_away_score smallint
    check (halftime_away_score is null or halftime_away_score >= 0),
  add column if not exists summary text,
  add column if not exists report_source text;

alter table public.games
  drop constraint if exists games_possession_sum_check;

alter table public.games
  add constraint games_possession_sum_check check (
    (home_possession is null and away_possession is null)
    or (
      home_possession is not null
      and away_possession is not null
      and home_possession + away_possession = 100
    )
  );

alter table public.game_players
  add column if not exists lineup_line text
    check (lineup_line is null or lineup_line in ('goalkeeper', 'defense', 'midfield', 'offense'));

create table if not exists public.game_events (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  half smallint not null check (half in (1, 2)),
  minute smallint not null check (minute >= 1 and minute <= 150),
  event_type text not null check (event_type in ('goal', 'own_goal', 'penalty_goal', 'yellow_card', 'red_card')),
  is_our_team boolean not null default true,
  player_id uuid references public.players (id) on delete set null,
  player_name_override text,
  assist_player_id uuid references public.players (id) on delete set null,
  event_note text,
  home_score_after smallint check (home_score_after is null or home_score_after >= 0),
  away_score_after smallint check (away_score_after is null or away_score_after >= 0),
  sort_order smallint not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists game_events_game_timeline_idx
  on public.game_events (game_id, half, minute, sort_order, created_at);

drop trigger if exists set_game_events_updated_at on public.game_events;
create trigger set_game_events_updated_at
before update on public.game_events
for each row execute function public.set_current_timestamp_updated_at();

alter table public.game_events enable row level security;

drop policy if exists "Active club members can read game events" on public.game_events;
create policy "Active club members can read game events"
on public.game_events
for select to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
  )
);

drop policy if exists "Active admins can manage game events" on public.game_events;
create policy "Active admins can manage game events"
on public.game_events
for all to authenticated
using (public.current_app_is_active_admin())
with check (public.current_app_is_active_admin());

drop policy if exists "Active coaches can manage assigned team game events" on public.game_events;
create policy "Active coaches can manage assigned team game events"
on public.game_events
for all to authenticated
using (
  exists (
    select 1
    from public.profiles p
    join public.games g on g.id = game_events.game_id
    join public.coach_teams ct on ct.team_id = g.team_id and ct.coach_id = p.id
    where p.id = auth.uid()
      and p.role = 'coach'
      and p.status = 'active'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    join public.games g on g.id = game_events.game_id
    join public.coach_teams ct on ct.team_id = g.team_id and ct.coach_id = p.id
    where p.id = auth.uid()
      and p.role = 'coach'
      and p.status = 'active'
  )
);
