import { z } from 'zod'
import { getGames } from '@@/server/utils/admin-games'
import { getGamePlayers, requireCalendarAccess } from '@@/server/utils/game-attendance'

export default defineEventHandler(async (event) => {
  const gameId = z.uuid().parse(event.context.params?.id)
  const { adminClient } = await requireCalendarAccess(event)
  const game = (await getGames(adminClient, { includeAll: true })).find((item) => item.id === gameId)

  if (!game) throw createError({ statusCode: 404, statusMessage: 'Game not found.' })

  return { game, players: await getGamePlayers(adminClient, gameId) }
})
