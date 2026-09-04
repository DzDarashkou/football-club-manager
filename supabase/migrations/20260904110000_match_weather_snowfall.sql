alter table public.match_weather_cache
  add column snowfall_mm double precision not null default 0 check (snowfall_mm >= 0);
