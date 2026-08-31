import { z } from 'zod'
import { getGames } from '@@/server/utils/admin-games'
import { getGamePlayers } from '@@/server/utils/game-attendance'
import { requireAdminAccess } from '@@/server/utils/admin-users'

export default defineEventHandler(async (event) => {
  const gameId = z.uuid().parse(event.context.params?.id)
  const { adminClient } = await requireAdminAccess(event)
  const game = (await getGames(adminClient)).find((item) => item.id === gameId)
  if (!game) throw createError({ statusCode: 404, statusMessage: 'Game not found.' })
  return { game, players: await getGamePlayers(adminClient, gameId) }
})
