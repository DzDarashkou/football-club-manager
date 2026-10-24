---
name: sync-pzpn
description: Synchronize match fixtures and league standings from Łączy Nas Piłka (PZPN) into the Supabase database. Use when the user asks to sync games, check match schedules, update kickoff times/venues, or refresh standings from PZPN.
---

# PZPN Match Fixtures & Standings Synchronizer

This skill automates fetching match fixtures and league standings from **Łączy Nas Piłka** (`laczynaspilka.pl`) for Sporting Wrocław teams and updating the Supabase database.

## When to Run

Run this workflow whenever:
- You want to import upcoming league fixtures for Sporting Wrocław teams.
- Match kickoff dates, times, or venues may have been rescheduled on PZPN.
- Match results/scores need to be pulled after a weekend round.
- New standings snapshots need to be saved.

## How to Execute

### 1. Preview Changes (Dry-Run Mode)
To check what matches or tables have changed without altering the database:
```bash
npm run sync:pzpn
```
The scraper will launch a headless browser session, capture recent data from PZPN, and print a clear diff showing:
- ➕ New matches detected
- 🔄 Rescheduled matches (kickoff times, venue updates)
- ⚽ Match scores & status updates
- 📊 Standings snapshot updates

### 2. Apply Changes to Database (Commit Mode)
When you are satisfied with the preview, commit the changes to Supabase:
```bash
npm run sync:pzpn:commit
```

### Configuration
- Tracked teams and URL endpoints are defined in `scripts/pzpn-scraper.ts`.
- Database credentials are read from `.env` (`NUXT_PUBLIC_SUPABASE_URL` and `NUXT_SUPABASE_SECRET_KEY`).
- Auto-creates any newly detected stadium in `public.venues`.
- Standings snapshots are imported into `standings_snapshots` linked to `team_competition_groups`.

