create table public.training_series (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete restrict,
  venue_id uuid references public.venues (id) on delete restrict,
  weekday smallint not null check (weekday between 1 and 7),
  starts_on date not null,
  ends_on date not null,
  starts_at time not null,
  duration_minutes smallint not null default 90 check (duration_minutes between 15 and 360),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint training_series_dates_check check (ends_on >= starts_on)
);

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.training_series (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete restrict,
  venue_id uuid references public.venues (id) on delete restrict,
  scheduled_at timestamptz not null,
  duration_minutes smallint not null check (duration_minutes between 15 and 360),
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint training_sessions_series_scheduled_key unique (series_id, scheduled_at)
);

create index training_series_team_id_idx on public.training_series (team_id);
create index training_sessions_team_scheduled_at_idx on public.training_sessions (team_id, scheduled_at desc);
create index training_sessions_scheduled_at_idx on public.training_sessions (scheduled_at);

create trigger set_training_series_updated_at before update on public.training_series for each row execute function public.set_current_timestamp_updated_at();
create trigger set_training_sessions_updated_at before update on public.training_sessions for each row execute function public.set_current_timestamp_updated_at();

-- Materialise recurring sessions so calendar links and weather forecasts have stable IDs.
create or replace function public.create_training_series(
  p_team_id uuid, p_venue_id uuid, p_weekday smallint, p_starts_on date, p_ends_on date,
  p_starts_at time, p_duration_minutes smallint, p_notes text
) returns uuid
language plpgsql
as $$
declare
  new_series_id uuid;
begin
  insert into public.training_series (team_id, venue_id, weekday, starts_on, ends_on, starts_at, duration_minutes, notes)
  values (p_team_id, p_venue_id, p_weekday, p_starts_on, p_ends_on, p_starts_at, p_duration_minutes, p_notes)
  returning id into new_series_id;

  insert into public.training_sessions (series_id, team_id, venue_id, scheduled_at, duration_minutes, notes)
  select new_series_id, p_team_id, p_venue_id,
    ((day::date::text || ' ' || p_starts_at::text)::timestamp at time zone 'Europe/Warsaw'),
    p_duration_minutes, p_notes
  from generate_series(p_starts_on, p_ends_on, interval '1 day') as day
  where extract(isodow from day) = p_weekday;

  return new_series_id;
end;
$$;

create table public.training_weather_cache (
  training_session_id uuid primary key references public.training_sessions (id) on delete cascade,
  kickoff_at timestamptz not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  temperature_min double precision not null,
  temperature_max double precision not null,
  precipitation_probability smallint not null check (precipitation_probability between 0 and 100),
  precipitation_mm double precision not null check (precipitation_mm >= 0),
  max_rain_mm double precision not null check (max_rain_mm >= 0),
  snowfall_mm double precision not null default 0 check (snowfall_mm >= 0),
  condition text not null check (condition in ('dry', 'possible-rain', 'rain-likely')),
  fetched_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null
);
create index training_weather_cache_expires_at_idx on public.training_weather_cache (expires_at);

alter table public.training_series enable row level security;
alter table public.training_sessions enable row level security;
alter table public.training_weather_cache enable row level security;
create policy "Active admins can manage training series" on public.training_series for all to authenticated using (public.current_app_is_active_admin()) with check (public.current_app_is_active_admin());
create policy "Active admins can manage training sessions" on public.training_sessions for all to authenticated using (public.current_app_is_active_admin()) with check (public.current_app_is_active_admin());
