-- Every match begins at 0–0. Existing matches are normalised before enforcing this invariant.
update public.games
set home_score = coalesce(home_score, 0),
    away_score = coalesce(away_score, 0)
where home_score is null or away_score is null;

alter table public.games
  alter column home_score set default 0,
  alter column away_score set default 0,
  alter column home_score set not null,
  alter column away_score set not null;
