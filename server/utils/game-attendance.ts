import { createError } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { z } from 'zod'
import { extractUserId } from '@@/lib/auth'
import { handleApiError } from '@@/server/utils/admin-users'
import type { GamePlayer } from '@@/types/admin-club'
import type { Database } from '@@/types/database'

type AdminClient = ReturnType<typeof serverSupabaseServiceRole<Database>>
const uuid = z.uuid('A valid id is required.')
export const playerIdsSchema = z.object({ player_ids: z.array(uuid).min(1).max(60) })
export const availabilitySchema = z.object({ availability_status: z.enum(['available', 'unavailable']), availability_note: z.string().trim().max(500).nullable().optional().default(null) })
export const statisticsSchema = z.object({ selection_status: z.enum(['selected', 'started', 'substitute', 'not_selected']), participated: z.boolean(), minutes_played: z.coerce.number().int().min(0).max(180), goals: z.coerce.number().int().min(0).max(30), assists: z.coerce.number().int().min(0).max(30), yellow_cards: z.coerce.number().int().min(0).max(2), red_cards: z.coerce.number().int().min(0).max(1), coach_note: z.string().trim().max(500).nullable().optional().default(null) })

function fail(error: unknown, message: string): never { handleApiError(error, message, 400) }
async function currentActor(event: Parameters<typeof serverSupabaseUser>[0], requiredRole: 'coach' | 'parent') {
  const userId = extractUserId(await serverSupabaseUser(event))
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'You must be signed in.' })
  const adminClient = serverSupabaseServiceRole<Database>(event)
  let request = adminClient.from('profiles').select('id, role').eq('id', userId).eq('status', 'active')
  request = requiredRole === 'coach'
    ? request.in('role', ['admin', 'coach'])
    : request.eq('role', 'parent')
  const { data, error } = await request.maybeSingle()
  if (error) fail(error, 'Unable to verify your account.')
  if (!data) throw createError({ statusCode: 403, statusMessage: 'You do not have access to this action.' })
  return { userId, adminClient, role: data.role }
}

export async function requireCoachAccess(event: Parameters<typeof serverSupabaseUser>[0]) {
  return currentActor(event, 'coach')
}

export async function requireCoachGame(event: Parameters<typeof serverSupabaseUser>[0], gameId: string) {
  const { userId, adminClient, role } = await requireCoachAccess(event)
  const { data: game, error: gameError } = await adminClient.from('games').select('id, team_id, status').eq('id', gameId).maybeSingle()
  if (gameError) fail(gameError, 'Unable to load the game.')
  if (!game) throw createError({ statusCode: 404, statusMessage: 'Game not found.' })
  if (role === 'coach') {
    const { data: assignment, error: assignmentError } = await adminClient.from('coach_teams').select('coach_id').eq('coach_id', userId).eq('team_id', game.team_id).maybeSingle()
    if (assignmentError) fail(assignmentError, 'Unable to verify team assignment.')
    if (!assignment) throw createError({ statusCode: 403, statusMessage: 'You are not assigned to this team.' })
  }
  return { adminClient, game }
}

export async function requireCoachPlayer(event: Parameters<typeof serverSupabaseUser>[0], playerId: string) {
  const { userId, adminClient, role } = await requireCoachAccess(event)
  const { data: player, error: playerError } = await adminClient.from('players').select('id, team_id').eq('id', playerId).maybeSingle()
  if (playerError) fail(playerError, 'Unable to load the player.')
  if (!player) throw createError({ statusCode: 404, statusMessage: 'Player not found.' })
  if (role === 'coach') {
    const { data: assignment, error: assignmentError } = await adminClient.from('coach_teams').select('coach_id').eq('coach_id', userId).eq('team_id', player.team_id).maybeSingle()
    if (assignmentError) fail(assignmentError, 'Unable to verify team assignment.')
    if (!assignment) throw createError({ statusCode: 403, statusMessage: 'You are not assigned to this team.' })
  }
  return { adminClient, player }
}

export async function requireParentGamePlayer(event: Parameters<typeof serverSupabaseUser>[0], gameId: string, playerId: string) {
  const { userId, adminClient } = await currentActor(event, 'parent')
  const { data: relation, error } = await adminClient.from('player_parents').select('player_id').eq('player_id', playerId).eq('parent_id', userId).maybeSingle()
  if (error) fail(error, 'Unable to verify player relationship.')
  if (!relation) throw createError({ statusCode: 403, statusMessage: 'You can respond only for your own child.' })
  const { data: gamePlayer, error: gamePlayerError } = await adminClient.from('game_players').select('game_id').eq('game_id', gameId).eq('player_id', playerId).maybeSingle()
  if (gamePlayerError) fail(gamePlayerError, 'Unable to load the game selection.')
  if (!gamePlayer) throw createError({ statusCode: 404, statusMessage: 'This player is not selected for the game.' })
  const { data: game, error: gameError } = await adminClient.from('games').select('status').eq('id', gameId).maybeSingle()
  if (gameError) fail(gameError, 'Unable to load the game.')
  if (!game || !['scheduled', 'postponed'].includes(game.status)) throw createError({ statusCode: 400, statusMessage: 'Attendance can no longer be updated for this game.' })
  return { adminClient }
}

export async function getGamePlayers(adminClient: AdminClient, gameId: string): Promise<GamePlayer[]> {
  const [records, players] = await Promise.all([
    adminClient.from('game_players').select('game_id, player_id, availability_status, availability_note, responded_at, selection_status, participated, minutes_played, goals, assists, yellow_cards, red_cards, coach_note').eq('game_id', gameId).order('created_at'),
    adminClient.from('players').select('id, full_name'),
  ])
  if (records.error) fail(records.error, 'Unable to load game players.')
  if (players.error) fail(players.error, 'Unable to load players.')
  const playerMap = new Map((players.data ?? []).map((player) => [player.id, player]))
  return (records.data ?? []).flatMap((record) => {
    const player = playerMap.get(record.player_id)
    return player ? [{ ...record, availability_status: record.availability_status as GamePlayer['availability_status'], selection_status: record.selection_status as GamePlayer['selection_status'], player }] : []
  })
}
