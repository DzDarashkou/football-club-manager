create type public.user_status as enum ('active', 'inactive');

alter table public.profiles
add column status public.user_status not null default 'active';

create index profiles_role_status_idx
on public.profiles (role, status);
