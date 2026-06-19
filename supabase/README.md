# Supabase Auth Setup

This project uses Supabase Auth for sign-in and a `public.profiles` table for the canonical application role.

## Admin user management

The app now includes an admin-only `/admin/users` screen for managing `coach` and `parent` accounts.

Server-side admin endpoints use the Supabase service role key. Set this environment variable before using the admin user tools:

```bash
NUXT_SUPABASE_SECRET_KEY=your_service_role_key
```

Each managed profile now includes:

- `role`: `admin`, `coach`, or `parent`
- `status`: `active` or `inactive`

New coach and parent accounts are created in Supabase Auth and then sent a password setup email that redirects to `/update-password`.

## Manual user provisioning

Example:

```sql
insert into public.profiles (id, email, role, status, full_name)
values ('AUTH_USER_UUID', 'coach@sporting.pl', 'coach', 'active', 'Coach Example');
```

If a user exists in Supabase Auth but does not have a matching `profiles` row, the app will sign them out and block access to protected routes.
