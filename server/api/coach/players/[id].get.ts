import { z } from 'zod'
import { getPlayerById } from '@@/server/utils/admin-club'
import { requireCoachPlayer } from '@@/server/utils/game-attendance'

export default defineEventHandler(async (event) => {
  const playerId = z.uuid().parse(event.context.params?.id)
  const { adminClient } = await requireCoachPlayer(event, playerId)
  const player = await getPlayerById(adminClient, playerId)
  if (!player) throw createError({ statusCode: 404, statusMessage: 'Player not found.' })
  return { player }
})
