import { createError } from 'h3'
import { z } from 'zod'
import { handleApiError } from '@@/server/utils/admin-users'
import { requireCoachGame } from '@@/server/utils/game-attendance'

const uuid = z.uuid('A valid id is required.')

export default defineEventHandler(async (event) => {
  const gameId = uuid.parse(event.context.params?.id)
  const playerId = uuid.parse(event.context.params?.playerId)
  const { adminClient } = await requireCoachGame(event, gameId)

  try {
    const { data, error } = await adminClient
      .from('game_players')
      .delete()
      .eq('game_id', gameId)
      .eq('player_id', playerId)
      .select('player_id')
      .maybeSingle()

    if (error) handleApiError(error, 'Unable to remove player from the game.', 400)
    if (!data) throw createError({ statusCode: 404, statusMessage: 'Player is not in this game squad.' })

    return { success: true }
  }
  catch (error) {
    handleApiError(error, 'Unable to remove player from the game.', 400)
  }
})
