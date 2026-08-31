import { createError } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { handleApiError } from '@@/server/utils/admin-users'
import { getTeams } from '@@/server/utils/admin-club'
import type { AdminCompetition, AdminGame, AdminGameSetupResponse, AdminSeason, AdminVenue, CompetitionType, GameLocationType, GameStatus } from '@@/types/admin-club'
import type { Database } from '@@/types/database'

type AdminClient = ReturnType<typeof serverSupabaseServiceRole<Database>>
const name = z.string().trim().min(2).max(120)
const id = z.uuid('A valid record id is required.')
const nullableId = z.union([id, z.null()]).optional().default(null)
export const seasonSchema = z.object({ name, starts_on: z.iso.date(), ends_on: z.iso.date() }).refine((value) => value.ends_on >= value.starts_on, { path: ['ends_on'], message: 'Season end date must be after its start date.' })
export const competitionSchema = z.object({ season_id: id, name, type: z.enum(['league', 'cup', 'friendly', 'tournament']) })
export const venueSchema = z.object({ name, address: z.string().trim().max(200).nullable().optional().default(null), city: z.string().trim().max(80).nullable().optional().default(null) })
export const gameSchema = z.object({
  team_id: id,
  season_id: id,
  competition_id: nullableId,
  venue_id: nullableId,
  opponent_name: name,
  location_type: z.enum(['home', 'away', 'neutral']),
  scheduled_at: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'A valid kickoff date and time is required.'),
  matchday: z.coerce.number().int().positive().nullable().optional().default(null),
  round_label: z.string().trim().max(80).nullable().optional().default(null),
  status: z.enum(['scheduled', 'completed', 'postponed', 'cancelled']).default('scheduled'),
  home_score: z.coerce.number().int().min(0).nullable().optional().default(null),
  away_score: z.coerce.number().int().min(0).nullable().optional().default(null),
  notes: z.string().trim().max(1000).nullable().optional().default(null),
}).superRefine((value, context) => {
  if (value.status === 'completed' && (value.home_score === null || value.away_score === null)) {
    context.addIssue({ code: 'custom', path: ['home_score'], message: 'Completed games require both scores.' })
  }
})

function fail(error: unknown, message: string): never { handleApiError(error, message, 400) }

export async function getGameSetup(adminClient: AdminClient): Promise<AdminGameSetupResponse> {
  const [seasonResult, competitionResult, venueResult, teams] = await Promise.all([
    adminClient.from('seasons').select('id, name, starts_on, ends_on, is_active').order('starts_on', { ascending: false }),
    adminClient.from('competitions').select('id, season_id, name, type, is_active').order('name'),
    adminClient.from('venues').select('id, name, address, city, is_active').order('name'),
    getTeams(adminClient),
  ])
  if (seasonResult.error) fail(seasonResult.error, 'Unable to load seasons.')
  if (competitionResult.error) fail(competitionResult.error, 'Unable to load competitions.')
  if (venueResult.error) fail(venueResult.error, 'Unable to load venues.')
  const seasons = seasonResult.data ?? []
  const seasonById = new Map(seasons.map((season) => [season.id, season]))
  const competitions: AdminCompetition[] = (competitionResult.data ?? []).flatMap((competition) => {
    const season = seasonById.get(competition.season_id)
    return season ? [{ ...competition, type: competition.type as CompetitionType, season: { id: season.id, name: season.name } }] : []
  })
  return { seasons, competitions, venues: venueResult.data ?? [], teams }
}

export async function validateGameReferences(adminClient: AdminClient, payload: z.infer<typeof gameSchema>) {
  const setup = await getGameSetup(adminClient)
  if (!setup.teams.some((team) => team.id === payload.team_id && team.is_active)) throw createError({ statusCode: 400, statusMessage: 'Select an active team.' })
  if (!setup.seasons.some((season) => season.id === payload.season_id && season.is_active)) throw createError({ statusCode: 400, statusMessage: 'Select an active season.' })
  if (payload.competition_id && !setup.competitions.some((competition) => competition.id === payload.competition_id && competition.is_active && competition.season_id === payload.season_id)) throw createError({ statusCode: 400, statusMessage: 'Select an active competition from the selected season.' })
  if (payload.venue_id && !setup.venues.some((venue) => venue.id === payload.venue_id && venue.is_active)) throw createError({ statusCode: 400, statusMessage: 'Select an active venue.' })
}

export async function getGames(adminClient: AdminClient): Promise<AdminGame[]> {
  const [gameResult, setup] = await Promise.all([
    adminClient.from('games').select('id, team_id, season_id, competition_id, venue_id, opponent_name, location_type, scheduled_at, matchday, round_label, status, home_score, away_score, notes').order('scheduled_at', { ascending: false }).limit(100),
    getGameSetup(adminClient),
  ])
  if (gameResult.error) fail(gameResult.error, 'Unable to load games.')
  const teams = new Map(setup.teams.map((item) => [item.id, item]))
  const seasons = new Map(setup.seasons.map((item) => [item.id, item]))
  const competitions = new Map(setup.competitions.map((item) => [item.id, item]))
  const venues = new Map(setup.venues.map((item) => [item.id, item]))
  return (gameResult.data ?? []).flatMap((game) => {
    const team = teams.get(game.team_id); const season = seasons.get(game.season_id)
    if (!team || !season) return []
    const competition = game.competition_id ? competitions.get(game.competition_id) ?? null : null
    const venue = game.venue_id ? venues.get(game.venue_id) ?? null : null
    return [{ ...game, location_type: game.location_type as GameLocationType, status: game.status as GameStatus, team: { id: team.id, name: team.name }, season: { id: season.id, name: season.name }, competition: competition ? { id: competition.id, name: competition.name, type: competition.type } : null, venue: venue ? { id: venue.id, name: venue.name, city: venue.city } : null }]
  })
}
