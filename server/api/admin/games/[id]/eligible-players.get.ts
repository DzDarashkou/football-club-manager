import { z } from 'zod'
import { getGames } from '@@/server/utils/admin-games'
import { requireAdminAccess } from '@@/server/utils/admin-users'
import { getActiveTeamPlayers } from '@@/server/utils/game-attendance'

export default defineEventHandler(async (event) => {
  const gameId = z.uuid().parse(event.context.params?.id)
  const { adminClient } = await requireAdminAccess(event)
  const game = (await getGames(adminClient)).find((item) => item.id === gameId)
  if (!game) throw createError({ statusCode: 404, statusMessage: 'Game not found.' })
  return { players: await getActiveTeamPlayers(adminClient, game.team_id) }
})
