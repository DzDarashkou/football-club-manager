import { createError } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { getTeams } from '@@/server/utils/admin-club'
import { handleApiError } from '@@/server/utils/admin-users'
import type { AdminTrainingSession, AdminVenue, TrainingCreateInput } from '@@/types/admin-club'
import type { Database } from '@@/types/database'

type AdminClient = ReturnType<typeof serverSupabaseServiceRole<Database>>
const uuid = z.uuid('Wybierz prawidłowy rekord.')
export const trainingCreateSchema = z.object({
  team_id: uuid,
  venue_id: z.union([uuid, z.null()]).optional().default(null),
  weekday: z.coerce.number().int().min(1).max(7),
  starts_on: z.iso.date(),
  ends_on: z.iso.date(),
  starts_at: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Podaj prawidłową godzinę.'),
  duration_minutes: z.coerce.number().int().min(15).max(360).default(90),
  notes: z.string().trim().max(1000).nullable().optional().default(null),
}).refine(value => value.ends_on >= value.starts_on, { path: ['ends_on'], message: 'Data końcowa nie może być wcześniejsza niż początkowa.' })

function fail(error: unknown, message: string): never { handleApiError(error, message, 400) }
export async function validateTrainingReferences(client: AdminClient, payload: TrainingCreateInput) {
  const [teams, venues] = await Promise.all([getTeams(client), client.from('venues').select('id, is_active')])
  if (!teams.some(team => team.id === payload.team_id && team.is_active)) throw createError({ statusCode: 400, statusMessage: 'Wybierz aktywną drużynę.' })
  if (venues.error) fail(venues.error, 'Nie udało się wczytać miejsc.')
  if (payload.venue_id && !(venues.data ?? []).some(venue => venue.id === payload.venue_id && venue.is_active)) throw createError({ statusCode: 400, statusMessage: 'Wybierz aktywne miejsce.' })
}

export async function getTrainingSessions(client: AdminClient, startsAt?: string, endsBefore?: string): Promise<AdminTrainingSession[]> {
  let query = client.from('training_sessions').select('id, series_id, team_id, venue_id, scheduled_at, duration_minutes, status, notes').order('scheduled_at')
  if (startsAt) query = query.gte('scheduled_at', startsAt)
  if (endsBefore) query = query.lt('scheduled_at', endsBefore)
  const [sessions, teams, venues] = await Promise.all([query, getTeams(client), client.from('venues').select('id, name, address, city, latitude, longitude')])
  if (sessions.error) fail(sessions.error, 'Nie udało się wczytać treningów.')
  if (venues.error) fail(venues.error, 'Nie udało się wczytać miejsc.')
  const teamMap = new Map(teams.map(team => [team.id, team])); const venueMap = new Map((venues.data ?? []).map(venue => [venue.id, venue]))
  return (sessions.data ?? []).flatMap(session => {
    const team = teamMap.get(session.team_id)
    if (!team) return []
    const venue = session.venue_id ? venueMap.get(session.venue_id) ?? null : null
    return [{ ...session, status: session.status as 'scheduled' | 'cancelled', team: { id: team.id, name: team.name }, venue: venue ? venue as AdminVenue : null }]
  })
}

export async function getTrainingSession(client: AdminClient, id: string) {
  return (await getTrainingSessions(client)).find(training => training.id === id) ?? null
}
