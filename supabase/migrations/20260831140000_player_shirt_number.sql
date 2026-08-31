alter table public.players
add column shirt_number smallint;

alter table public.players
add constraint players_shirt_number_check
check (shirt_number is null or shirt_number between 1 and 99);

create unique index players_team_shirt_number_key
on public.players (team_id, shirt_number)
where shirt_number is not null;
