import { readBody } from 'h3'
import { z } from 'zod'
import { getGames } from '@@/server/utils/admin-games'
import { getActiveTeamPlayers, playerIdsSchema } from '@@/server/utils/game-attendance'
import { handleApiError, requireAdminAccess } from '@@/server/utils/admin-users'

export default defineEventHandler(async (event) => {
  const gameId = z.uuid().parse(event.context.params?.id)
  const { player_ids } = playerIdsSchema.parse(await readBody(event))
  const { adminClient } = await requireAdminAccess(event)
  const game = (await getGames(adminClient)).find((item) => item.id === gameId)
  if (!game) throw createError({ statusCode: 404, statusMessage: 'Game not found.' })
  try {
    const eligiblePlayerIds = new Set((await getActiveTeamPlayers(adminClient, game.team_id)).map((player) => player.id))
    if (!player_ids.every((playerId) => eligiblePlayerIds.has(playerId))) handleApiError(new Error('Every selected player must be active and belong to this team.'), 'Unable to add players.', 400)
    const { error } = await adminClient.from('game_players').upsert(player_ids.map((player_id) => ({ game_id: gameId, player_id })), { onConflict: 'game_id,player_id', ignoreDuplicates: true })
    if (error) handleApiError(error, 'Unable to add players to the game.', 400)
    return { success: true }
  }
  catch (error) { handleApiError(error, 'Unable to add players to the game.', 400) }
})
