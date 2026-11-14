-- Add external match tracking identifier for synchronization with PZPN / Łączy Nas Piłka
alter table public.games 
  add column if not exists external_id text;

-- Create unique index to allow deterministic upserts per team and match
create unique index if not exists games_team_external_id_idx 
  on public.games (team_id, external_id) 
  where external_id is not null;

