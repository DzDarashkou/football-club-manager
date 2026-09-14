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

## League standings

Apply `migrations/20260914100000_standings_history.sql` before using `/standings` and `/admin/standings`.

- All active admins, coaches and parents can view standings and import history.
- Admins add competition groups for an existing team and season, then paste the complete Łączy Nas Piłka table JSON and select the club's entry in the preview.
- Every successful import inserts a new snapshot, including repeated uploads of identical JSON. The newest import is displayed by default; previous versions remain available through the history selector.
- The first import binds a group to the source `play.id`. Later imports with another ID are rejected. Create a new group for another competition or season.
- The migration seeds the three requested Wrocław groups if teams named Sporting Wroclaw 1 / 2 (also accepting Wrocław) and an active season already exist. It uses the most recent active season. Otherwise add the groups in the admin UI; their names are offered as suggestions.
- Teams and seasons with competition groups cannot be deleted while those groups reference them. Snapshot history is retained; deactivate the team instead. Deleting an importer account only clears its attribution.

Validation tests: `node --test tests/standings-validation.test.mjs` (Node 24).
