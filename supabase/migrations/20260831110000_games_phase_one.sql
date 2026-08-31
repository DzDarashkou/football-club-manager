create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  starts_on date not null,
  ends_on date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint seasons_dates_check check (ends_on >= starts_on)
);

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete restrict,
  name text not null,
  type text not null check (type in ('league', 'cup', 'friendly', 'tournament')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint competitions_season_name_key unique (season_id, name)
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete restrict,
  season_id uuid not null references public.seasons (id) on delete restrict,
  competition_id uuid references public.competitions (id) on delete restrict,
  venue_id uuid references public.venues (id) on delete restrict,
  opponent_name text not null,
  location_type text not null check (location_type in ('home', 'away', 'neutral')),
  scheduled_at timestamptz not null,
  matchday smallint check (matchday is null or matchday > 0),
  round_label text,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'postponed', 'cancelled')),
  home_score smallint check (home_score is null or home_score >= 0),
  away_score smallint check (away_score is null or away_score >= 0),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint games_scores_complete_check check (
    (status = 'completed' and home_score is not null and away_score is not null)
    or status <> 'completed'
  )
);

create index competitions_season_id_idx on public.competitions (season_id);
create index games_team_scheduled_at_idx on public.games (team_id, scheduled_at desc);
create index games_season_id_idx on public.games (season_id);
create index games_competition_id_idx on public.games (competition_id);

create trigger set_seasons_updated_at before update on public.seasons for each row execute function public.set_current_timestamp_updated_at();
create trigger set_competitions_updated_at before update on public.competitions for each row execute function public.set_current_timestamp_updated_at();
create trigger set_venues_updated_at before update on public.venues for each row execute function public.set_current_timestamp_updated_at();
create trigger set_games_updated_at before update on public.games for each row execute function public.set_current_timestamp_updated_at();

alter table public.seasons enable row level security;
alter table public.competitions enable row level security;
alter table public.venues enable row level security;
alter table public.games enable row level security;

create policy "Active admins can manage seasons" on public.seasons for all to authenticated using (public.current_app_is_active_admin()) with check (public.current_app_is_active_admin());
create policy "Active admins can manage competitions" on public.competitions for all to authenticated using (public.current_app_is_active_admin()) with check (public.current_app_is_active_admin());
create policy "Active admins can manage venues" on public.venues for all to authenticated using (public.current_app_is_active_admin()) with check (public.current_app_is_active_admin());
create policy "Active admins can manage games" on public.games for all to authenticated using (public.current_app_is_active_admin()) with check (public.current_app_is_active_admin());
