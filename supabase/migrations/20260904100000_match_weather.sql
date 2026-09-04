alter table public.venues
  add column latitude double precision,
  add column longitude double precision,
  add constraint venues_latitude_check check (latitude is null or latitude between -90 and 90),
  add constraint venues_longitude_check check (longitude is null or longitude between -180 and 180),
  add constraint venues_coordinates_together_check check ((latitude is null) = (longitude is null));

create table public.weather_location_cache (
  city_key text primary key,
  city text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.match_weather_cache (
  game_id uuid primary key references public.games (id) on delete cascade,
  kickoff_at timestamptz not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  temperature_min double precision not null,
  temperature_max double precision not null,
  precipitation_probability smallint not null check (precipitation_probability between 0 and 100),
  precipitation_mm double precision not null check (precipitation_mm >= 0),
  max_rain_mm double precision not null check (max_rain_mm >= 0),
  condition text not null check (condition in ('dry', 'possible-rain', 'rain-likely')),
  fetched_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null
);

create index match_weather_cache_expires_at_idx on public.match_weather_cache (expires_at);

alter table public.weather_location_cache enable row level security;
alter table public.match_weather_cache enable row level security;
