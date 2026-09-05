alter table public.games drop constraint games_status_check;

alter table public.games
  add constraint games_status_check check (status in ('draft', 'scheduled', 'completed', 'postponed', 'cancelled'));
