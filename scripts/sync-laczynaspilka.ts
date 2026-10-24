import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import {
  parsePzpnDateTimeToUtcIso,
  parseStadiumInfo,
  mapPzpnStateToGameStatus,
  extractScores,
  parsePzpnMatchesJson,
  type PzpnMatch,
} from '@@/validators/pzpn-matches'
import { scrapePzpnDataForTeams, DEFAULT_PZPN_TEAMS } from './pzpn-scraper'
import type { Database } from '@@/types/database'

// 1. Load environment variables from .env if needed
function loadEnv() {
  const envPath = resolve(process.cwd(), '.env')
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, 'utf-8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim()
        let val = trimmed.slice(eqIdx + 1).trim()
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1)
        }
        if (!process.env[key]) {
          process.env[key] = val
        }
      }
    }
  }
}

loadEnv()

const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.NUXT_SUPABASE_SECRET_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Error: Missing NUXT_PUBLIC_SUPABASE_URL or NUXT_SUPABASE_SECRET_KEY in environment or .env file.',
  )
  process.exit(1)
}

const isCommitMode = process.argv.includes('--commit')
const supabase = createClient<Database>(supabaseUrl, supabaseKey)

type VenueRecord = {
  id: string
  name: string
  address: string | null
  city: string | null
  is_active: boolean
}

type TeamRecord = {
  id: string
  name: string
  is_active: boolean
}

type SeasonRecord = {
  id: string
  name: string
  starts_on: string
  ends_on: string
  is_active: boolean
}

type ExistingGame = {
  id: string
  external_id: string | null
  team_id: string
  season_id: string
  matchday: number | null
  round_label: string | null
  opponent_name: string
  location_type: string
  scheduled_at: string
  venue_id: string | null
  status: string
  home_score: number
  away_score: number
  notes: string | null
}

async function getOrAutoCreateVenue(
  stadiumText: string | null | undefined,
  existingVenues: VenueRecord[],
): Promise<string | null> {
  const parsed = parseStadiumInfo(stadiumText)
  if (!parsed) return null

  // 1. Match by name or address
  const matched = existingVenues.find(
    (v) =>
      v.name.toLowerCase() === parsed.name.toLowerCase() ||
      (v.address &&
        parsed.address &&
        v.address.toLowerCase() === parsed.address.toLowerCase()),
  )

  if (matched) return matched.id

  // 2. If not found, create if commit mode
  if (isCommitMode) {
    console.log(`[Venue] Creating new venue: "${parsed.name}" (${parsed.address || ''})`)
    const { data, error } = await supabase
      .from('venues')
      .insert({
        name: parsed.name,
        address: parsed.address,
        city: parsed.city,
        is_active: true,
      })
      .select('id, name, address, city, is_active')
      .single()

    if (error) {
      console.warn(`[Venue] Failed to create venue "${parsed.name}":`, error.message)
      return null
    }

    if (data) {
      existingVenues.push(data)
      return data.id
    }
  } else {
    console.log(`[Venue (Dry-Run)] Would create new venue: "${parsed.name}" (${parsed.address || ''})`)
  }

  return null
}

function matchLocalTeam(
  pzpnTeamName: string,
  localTeams: TeamRecord[],
): TeamRecord | undefined {
  const normalized = pzpnTeamName.toLowerCase().replace(/ł/g, 'l').trim()
  if (normalized.includes('ii') || normalized.includes(' 2')) {
    return (
      localTeams.find((t) => {
        const tNorm = t.name.toLowerCase().replace(/ł/g, 'l')
        return tNorm.includes('2') || tNorm.includes('ii')
      }) || localTeams[0]
    )
  }
  return (
    localTeams.find((t) => {
      const tNorm = t.name.toLowerCase().replace(/ł/g, 'l')
      return (
        !tNorm.includes('2') &&
        !tNorm.includes('ii') &&
        tNorm.includes('sporting')
      )
    }) || localTeams[0]
  )
}

async function runSync() {
  console.log('='.repeat(65))
  console.log(`⚽ ŁĄCZY NAS PIŁKA (PZPN) SYNCHRONIZER`)
  console.log(`Mode: ${isCommitMode ? '🚀 COMMIT (APPLYING TO DB)' : '🔍 DRY-RUN (PREVIEW ONLY)'}`)
  console.log('='.repeat(65))

  // 1. Fetch reference data from database
  const [teamsRes, seasonsRes, venuesRes, groupsRes, adminRes] = await Promise.all([
    supabase.from('teams').select('id, name, is_active').eq('is_active', true),
    supabase
      .from('seasons')
      .select('id, name, starts_on, ends_on, is_active')
      .eq('is_active', true)
      .order('starts_on', { ascending: false })
      .limit(1),
    supabase
      .from('venues')
      .select('id, name, address, city, is_active'),
    supabase
      .from('team_competition_groups')
      .select('id, team_id, season_id, name, external_play_id'),
    supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle(),
  ])

  if (teamsRes.error || !teamsRes.data || teamsRes.data.length === 0) {
    console.error('Error fetching teams:', teamsRes.error?.message || 'No teams found')
    process.exit(1)
  }

  if (seasonsRes.error || !seasonsRes.data || seasonsRes.data.length === 0) {
    console.error('Error fetching active season:', seasonsRes.error?.message || 'No active season')
    process.exit(1)
  }

  const activeSeason = seasonsRes.data[0]!
  const localTeams: TeamRecord[] = teamsRes.data
  const venues = (venuesRes.data || []) as VenueRecord[]
  const trackedGroups = groupsRes.data || []
  const adminActorId = adminRes.data?.id || '00000000-0000-0000-0000-000000000000'

  console.log(`[Config] Active Season: ${activeSeason.name}`)
  console.log(`[Config] Available Teams: ${localTeams.map((t) => t.name).join(', ')}`)
  console.log(`[Config] Tracked Groups in DB: ${trackedGroups.length}`)

  // 2. Load existing games for active season
  let hasExternalIdColumn = true
  let existingGames: ExistingGame[] = []

  const gamesResWithExternal = await supabase
    .from('games')
    .select(
      'id, external_id, team_id, season_id, matchday, round_label, opponent_name, location_type, scheduled_at, venue_id, status, home_score, away_score, notes',
    )
    .eq('season_id', activeSeason.id)

  if (gamesResWithExternal.error) {
    if (gamesResWithExternal.error.message.includes('external_id')) {
      hasExternalIdColumn = false
      console.log('ℹ️  Note: Column games.external_id not found in DB. Falling back to matchday/opponent matching.')
      console.log('    (Apply supabase/migrations/20261025090000_games_external_id.sql to enable external match IDs).')
      const gamesResFallback = await supabase
        .from('games')
        .select(
          'id, team_id, season_id, matchday, round_label, opponent_name, location_type, scheduled_at, venue_id, status, home_score, away_score, notes',
        )
        .eq('season_id', activeSeason.id)

      if (gamesResFallback.error) {
        console.error('Error fetching existing games:', gamesResFallback.error.message)
        process.exit(1)
      }
      existingGames = (gamesResFallback.data || []).map((g) => ({
        ...g,
        external_id: null,
      })) as ExistingGame[]
    } else {
      console.error('Error fetching existing games:', gamesResWithExternal.error.message)
      process.exit(1)
    }
  } else {
    existingGames = (gamesResWithExternal.data || []) as ExistingGame[]
  }

  console.log(`[Config] Existing Games in DB for this season: ${existingGames.length}`)

  // 3. Obtain match & table data
  let scrapeResults: Awaited<ReturnType<typeof scrapePzpnDataForTeams>> = []

  const fileArgIdx = process.argv.indexOf('--file')
  if (fileArgIdx !== -1 && process.argv[fileArgIdx + 1]) {
    const filePath = resolve(process.cwd(), process.argv[fileArgIdx + 1]!)
    console.log(`\n[Input] Reading match data from file: ${filePath}`)
    const content = readFileSync(filePath, 'utf-8')
    const parsedMatches = parsePzpnMatchesJson(content)
    scrapeResults = [
      {
        teamId: DEFAULT_PZPN_TEAMS[0].teamId,
        teamName: DEFAULT_PZPN_TEAMS[0].teamName,
        matches: parsedMatches,
        tables: [],
      },
    ]
  } else {
    console.log('\n[Scraper] Starting Playwright browser...')
    scrapeResults = await scrapePzpnDataForTeams(DEFAULT_PZPN_TEAMS)
  }

  // 4. Process Standings Tables
  console.log('\n--- STANDINGS / TABLES SYNC ---')
  let tablesUpdated = 0
  for (const result of scrapeResults) {
    for (const table of result.tables) {
      const playId = table.play?.id
      const matchingGroup = trackedGroups.find((g) => g.external_play_id === playId)

      if (!matchingGroup) {
        console.log(`[Standings] Table for play "${table.play?.name}" (${playId}) is not yet tracked in team_competition_groups. (Add group via /admin/standings first).`)
        continue
      }

      console.log(`[Standings] Found table for group "${matchingGroup.name}" (${table.rows.length} rows)`)

      if (isCommitMode) {
        // Find our club team's external team id in table
        const ourRow = table.rows.find((r: { team: { name: string } }) =>
          r.team.name.toLowerCase().includes('sporting'),
        )
        if (!ourRow) {
          console.warn(`[Standings] Could not identify Sporting in table rows. Skipping snapshot import.`)
          continue
        }

        // Call database RPC to import snapshot
        const { error: rpcError } = await supabase.rpc('import_standings_snapshot', {
          p_group_id: matchingGroup.id,
          p_actor_id: adminActorId,
          p_external_team_id: ourRow.team.id,
          p_table: table as any,
        })

        if (rpcError) {
          // If RPC actor fails check, insert directly into standings_snapshots with service role
          const { error: insertError } = await supabase
            .from('standings_snapshots')
            .insert({
              group_id: matchingGroup.id,
              imported_by: adminActorId,
              external_team_id: ourRow.team.id,
              table_data: table,
            })

          if (insertError) {
            console.error(`[Standings] Error saving snapshot: ${insertError.message}`)
          } else {
            console.log(`[Standings] ✅ Successfully imported new snapshot for ${matchingGroup.name}!`)
            tablesUpdated++
          }
        } else {
          console.log(`[Standings] ✅ Successfully imported new snapshot for ${matchingGroup.name}!`)
          tablesUpdated++
        }
      } else {
        console.log(`[Standings (Dry-Run)] Would import new snapshot for ${matchingGroup.name} (${table.rows.length} teams).`)
        tablesUpdated++
      }
    }
  }

  // 5. Process Matches / Fixtures
  console.log('\n--- MATCH FIXTURES SYNC ---')
  let newGamesCount = 0
  let updatedGamesCount = 0
  let unchangedGamesCount = 0

  for (const result of scrapeResults) {
    const defaultLocalTeam = matchLocalTeam(result.teamName, localTeams)
    if (!defaultLocalTeam) {
      console.warn(`[Matches] Could not match local team for ${result.teamName}`)
      continue
    }

    console.log(`\n📌 Checking matches for ${result.teamName} (DB Team: ${defaultLocalTeam.name}):`)

    for (const match of result.matches) {
      const isSportingHost = match.host.name.toLowerCase().includes('sporting')
      const locationType = isSportingHost ? 'home' : 'away'
      const opponentName = isSportingHost ? match.guest.name : match.host.name
      const scheduledAtIso = parsePzpnDateTimeToUtcIso(match.dateTime)
      const gameStatus = mapPzpnStateToGameStatus(match.state)
      const { homeScore, awayScore } = extractScores(match.scores)

      // Resolve venue
      const venueId = await getOrAutoCreateVenue(match.stadium, venues)

      // Check existing game by external_id or matchday + opponent
      const existing = existingGames.find(
        (g) =>
          (g.external_id && g.external_id === match.matchId) ||
          (g.team_id === defaultLocalTeam.id &&
            g.matchday === match.queue &&
            g.opponent_name.toLowerCase() === opponentName.toLowerCase()),
      )

      if (!existing) {
        // Plan INSERT
        newGamesCount++
        console.log(
          `  ➕ [NEW] Kolejka ${match.queue ?? '?'}: vs ${opponentName} (${locationType.toUpperCase()}) | ${match.dateTime} @ ${match.stadium || 'Brak stadionu'}`,
        )

        if (isCommitMode) {
          const insertPayload: any = {
            team_id: defaultLocalTeam.id,
            season_id: activeSeason.id,
            opponent_name: opponentName,
            location_type: locationType,
            scheduled_at: scheduledAtIso,
            matchday: match.queue ?? null,
            round_label: match.round ?? null,
            venue_id: venueId,
            status: gameStatus,
            home_score: homeScore,
            away_score: awayScore,
            has_broadcast: false,
          }
          if (hasExternalIdColumn) {
            insertPayload.external_id = match.matchId
          }
          const { error: insertError } = await supabase.from('games').insert(insertPayload)

          if (insertError) {
            console.error(`     ❌ Insert error: ${insertError.message}`)
          } else {
            console.log(`     ✅ Inserted successfully!`)
          }
        }
      } else {
        // Check if anything changed
        const timeDiff =
          Math.abs(new Date(existing.scheduled_at).getTime() - new Date(scheduledAtIso).getTime()) >
          60000 // > 1 minute diff
        const venueDiff = existing.venue_id !== venueId
        const statusDiff = existing.status !== gameStatus
        const scoreDiff =
          gameStatus === 'completed' &&
          (existing.home_score !== homeScore || existing.away_score !== awayScore)
        const missingExternalId = !existing.external_id

        if (timeDiff || venueDiff || statusDiff || scoreDiff || missingExternalId) {
          updatedGamesCount++
          console.log(`  🔄 [UPDATE] Kolejka ${match.queue ?? '?'}: vs ${opponentName}`)
          if (timeDiff) {
            console.log(`     Kickoff: ${existing.scheduled_at} -> ${scheduledAtIso}`)
          }
          if (venueDiff) {
            console.log(`     Venue updated -> ${match.stadium || 'None'}`)
          }
          if (statusDiff) {
            console.log(`     Status: ${existing.status} -> ${gameStatus}`)
          }
          if (scoreDiff) {
            console.log(`     Score: ${homeScore}:${awayScore}`)
          }

          if (isCommitMode) {
            const updatePayload: any = {
              scheduled_at: scheduledAtIso,
              venue_id: venueId,
              status: gameStatus,
              home_score: homeScore,
              away_score: awayScore,
              matchday: match.queue ?? existing.matchday,
              round_label: match.round ?? existing.round_label,
            }
            if (hasExternalIdColumn) {
              updatePayload.external_id = match.matchId
            }
            const { error: updateError } = await supabase
              .from('games')
              .update(updatePayload)
              .eq('id', existing.id)

            if (updateError) {
              console.error(`     ❌ Update error: ${updateError.message}`)
            } else {
              console.log(`     ✅ Updated successfully!`)
            }
          }
        } else {
          unchangedGamesCount++
          console.log(
            `  ✔️ [UP-TO-DATE] Kolejka ${match.queue ?? '?'}: vs ${opponentName} (${locationType}) @ ${match.dateTime}`,
          )
        }
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(65))
  console.log('📊 SYNCHRONIZATION SUMMARY')
  console.log('='.repeat(65))
  console.log(`New matches detected:         ${newGamesCount}`)
  console.log(`Rescheduled / updated matches: ${updatedGamesCount}`)
  console.log(`Unchanged matches:            ${unchangedGamesCount}`)
  console.log(`Standings tables synced:      ${tablesUpdated}`)
  console.log('='.repeat(65))

  if (!isCommitMode) {
    console.log('\n💡 Dry-run completed! No changes were written to the database.')
    console.log('👉 To apply these changes, run with: npm run sync:pzpn:commit')
  } else {
    console.log('\n🎉 Synchronization complete! All updates were committed to Supabase.')
  }
}

runSync().catch((err) => {
  console.error('\n❌ Unexpected sync failure:', err)
  process.exit(1)
})
