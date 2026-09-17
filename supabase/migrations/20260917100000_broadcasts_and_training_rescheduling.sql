alter table public.games
  add column has_broadcast boolean not null default false,
  add column broadcast_url text,
  add constraint games_broadcast_check check (
    (not has_broadcast and broadcast_url is null) or
    (has_broadcast and broadcast_url is not null and broadcast_url ~* '^https?://[^[:space:]]+$')
  );

alter table public.training_sessions
  drop constraint training_sessions_status_check,
  add column original_scheduled_at timestamptz,
  add constraint training_sessions_status_check check (status in ('scheduled', 'moved', 'cancelled')),
  add constraint training_sessions_moved_check check (
    status <> 'moved' or (original_scheduled_at is not null and scheduled_at <> original_scheduled_at)
  );
