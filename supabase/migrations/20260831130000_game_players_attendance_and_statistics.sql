create table public.game_players (
  game_id uuid not null references public.games (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete restrict,
  availability_status text not null default 'pending' check (availability_status in ('pending', 'available', 'unavailable')),
  availability_note text,
  responded_at timestamptz,
  selection_status text not null default 'selected' check (selection_status in ('selected', 'started', 'substitute', 'not_selected')),
  participated boolean not null default false,
  minutes_played smallint not null default 0 check (minutes_played >= 0 and minutes_played <= 180),
  goals smallint not null default 0 check (goals >= 0),
  assists smallint not null default 0 check (assists >= 0),
  yellow_cards smallint not null default 0 check (yellow_cards between 0 and 2),
  red_cards smallint not null default 0 check (red_cards between 0 and 1),
  coach_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (game_id, player_id)
);

create index game_players_player_id_idx on public.game_players (player_id);
create index game_players_game_availability_idx on public.game_players (game_id, availability_status);

create trigger set_game_players_updated_at
before update on public.game_players
for each row execute function public.set_current_timestamp_updated_at();

alter table public.game_players enable row level security;

create policy "Active admins can manage game players"
on public.game_players
for all to authenticated
using (public.current_app_is_active_admin())
with check (public.current_app_is_active_admin());
