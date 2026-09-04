alter table public.match_weather_cache
  add column wind_speed_kmh double precision not null default 0 check (wind_speed_kmh >= 0),
  add column max_wind_gust_kmh double precision not null default 0 check (max_wind_gust_kmh >= 0),
  add column wind_direction_degrees smallint not null default 0 check (wind_direction_degrees between 0 and 360),
  add column cloud_cover_percentage smallint not null default 0 check (cloud_cover_percentage between 0 and 100);

alter table public.training_weather_cache
  add column wind_speed_kmh double precision not null default 0 check (wind_speed_kmh >= 0),
  add column max_wind_gust_kmh double precision not null default 0 check (max_wind_gust_kmh >= 0),
  add column wind_direction_degrees smallint not null default 0 check (wind_direction_degrees between 0 and 360),
  add column cloud_cover_percentage smallint not null default 0 check (cloud_cover_percentage between 0 and 100);
