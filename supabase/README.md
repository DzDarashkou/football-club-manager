# Supabase Auth Setup

This project uses Supabase Auth for sign-in and a `public.profiles` table for the canonical application role.

## Manual user provisioning

For this phase, users are created manually in Supabase.

1. Create the user in `Authentication -> Users`.
2. Insert a matching row into `public.profiles`.
3. Set `role` to one of: `admin`, `coach`, `parent`.

Example:

```sql
insert into public.profiles (id, email, role, full_name)
values ('AUTH_USER_UUID', 'coach@sporting.pl', 'coach', 'Coach Example');
```

If a user exists in Supabase Auth but does not have a matching `profiles` row, the app will sign them out and block access to protected routes.
