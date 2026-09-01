-- Administrative deletion removes only records that belong to the deleted record.
-- Nullable game references are retained by setting them to NULL.
alter table public.teams drop constraint teams_age_group_id_fkey;
alter table public.teams add constraint teams_age_group_id_fkey foreign key (age_group_id) references public.age_groups (id) on delete cascade;
alter table public.players drop constraint players_team_id_fkey;
alter table public.players add constraint players_team_id_fkey foreign key (team_id) references public.teams (id) on delete cascade;
alter table public.game_players drop constraint game_players_player_id_fkey;
alter table public.game_players add constraint game_players_player_id_fkey foreign key (player_id) references public.players (id) on delete cascade;
alter table public.competitions drop constraint competitions_season_id_fkey;
alter table public.competitions add constraint competitions_season_id_fkey foreign key (season_id) references public.seasons (id) on delete cascade;
alter table public.games drop constraint games_team_id_fkey;
alter table public.games add constraint games_team_id_fkey foreign key (team_id) references public.teams (id) on delete cascade;
alter table public.games drop constraint games_season_id_fkey;
alter table public.games add constraint games_season_id_fkey foreign key (season_id) references public.seasons (id) on delete cascade;
alter table public.games drop constraint games_competition_id_fkey;
alter table public.games add constraint games_competition_id_fkey foreign key (competition_id) references public.competitions (id) on delete set null;
alter table public.games drop constraint games_venue_id_fkey;
alter table public.games add constraint games_venue_id_fkey foreign key (venue_id) references public.venues (id) on delete set null;
