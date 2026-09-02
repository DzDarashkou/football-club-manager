import { z } from 'zod'
import { gameResultSchema } from '@@/server/utils/admin-games'
import { handleApiError } from '@@/server/utils/admin-users'
import { requireCoachGame } from '@@/server/utils/game-attendance'

export default defineEventHandler(async (event) => {
  const gameId = z.uuid().parse(event.context.params?.id)
  const { adminClient } = await requireCoachGame(event, gameId)
  const payload = gameResultSchema.parse(await readBody(event))

  try {
    const { error } = await adminClient.from('games').update(payload).eq('id', gameId)
    if (error) handleApiError(error, 'Unable to update the game result.', 400)
    return { success: true }
  }
  catch (error) { handleApiError(error, 'Unable to update the game result.', 400) }
})
