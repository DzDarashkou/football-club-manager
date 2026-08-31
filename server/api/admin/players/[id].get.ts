import { z } from 'zod'
import { getPlayerById } from '@@/server/utils/admin-club'
import { getGames } from '@@/server/utils/admin-games'
import { getGamePlayers } from '@@/server/utils/game-attendance'
import { requireAdminAccess } from '@@/server/utils/admin-users'

export default defineEventHandler(async (event) => {
  const playerId = z.uuid().parse(event.context.params?.id)
  const { adminClient } = await requireAdminAccess(event)
  const player = await getPlayerById(adminClient, playerId)
  if (!player) throw createError({ statusCode: 404, statusMessage: 'Player not found.' })
  const { data: gameLinks, error } = await adminClient.from('game_players').select('game_id').eq('player_id', playerId)
  if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to load player games.' })
  const [allGames, gameRecords] = await Promise.all([
    getGames(adminClient),
    Promise.all((gameLinks ?? []).map(async ({ game_id }) => ({ game_id, record: (await getGamePlayers(adminClient, game_id)).find((item) => item.player_id === playerId) }))),
  ])
  const gamesById = new Map(allGames.map((game) => [game.id, game]))
  return { player, games: gameRecords.flatMap((item) => item.record && gamesById.get(item.game_id) ? [{ game: gamesById.get(item.game_id), record: item.record }] : []) }
})
