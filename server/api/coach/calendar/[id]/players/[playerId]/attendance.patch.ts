import { readBody } from 'h3'
import { z } from 'zod'
import { availabilitySchema, requireCalendarAccess } from '@@/server/utils/game-attendance'
import { handleApiError } from '@@/server/utils/admin-users'

export default defineEventHandler(async (event) => {
  const gameId = z.uuid().parse(event.context.params?.id)
  const playerId = z.uuid().parse(event.context.params?.playerId)
  const payload = availabilitySchema.parse(await readBody(event))
  // The demo has one parent account, which manages availability for the full squad.
  const { adminClient } = await requireCalendarAccess(event)

  const { data: game, error: gameError } = await adminClient.from('games').select('id').eq('id', gameId).maybeSingle()
  if (gameError) handleApiError(gameError, 'Unable to load the game.', 400)
  if (!game) throw createError({ statusCode: 404, statusMessage: 'Game not found.' })

  const { data, error } = await adminClient
    .from('game_players')
    .update({ availability_status: payload.availability_status, availability_note: payload.availability_note, responded_at: new Date().toISOString() })
    .eq('game_id', gameId)
    .eq('player_id', playerId)
    .select('player_id, availability_status, availability_note, responded_at')
    .maybeSingle()

  if (error) handleApiError(error, 'Unable to update attendance.', 400)
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Selected player was not found in this game.' })
  return { player: data }
})
